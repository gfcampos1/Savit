import { prisma } from '../lib/prisma.js';
import { env } from '../lib/env.js';
import { hashPassword, verifyPassword } from '../lib/passwords.js';
import {
  expiresInMs,
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
} from '../lib/jwt.js';
import { HttpError } from '../middleware/error.js';
import { ensureDefaultCategories } from './categories.js';
import {
  GoogleAuthError,
  exchangeCodeForProfile,
  verifyGoogleIdToken,
  type GoogleProfile,
} from './google-oauth.js';

export interface AuthResult {
  user: { id: string; email: string; name: string | null; createdAt: Date };
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

/** Computa data de expiração do trial pra um novo user. */
function computeTrialEndsAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + env.TRIAL_DAYS);
  return d;
}

export async function register(input: {
  email: string;
  password: string;
  name?: string;
  deviceInfo?: string;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, 'email_taken');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: input.name?.trim() || null,
      trialEndsAt: computeTrialEndsAt(),
    },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  await ensureDefaultCategories(user.id);

  return issueTokens(user, input.deviceInfo);
}

/**
 * Login (ou registro implícito) via Google OAuth.
 * - Se já existe user com mesmo email: linka googleId.
 * - Senão cria user novo (sem senha) + categorias default + trial.
 */
export async function loginWithGoogle(input: {
  credential: string;
  deviceInfo?: string;
}): Promise<AuthResult> {
  let profile;
  try {
    profile = await verifyGoogleIdToken(input.credential);
  } catch (err) {
    if (err instanceof GoogleAuthError) {
      throw new HttpError(err.status, err.message);
    }
    throw err;
  }
  return loginWithGoogleProfile(profile, input.deviceInfo);
}

/**
 * Variante que recebe um auth code do popup ux (oauth2.initCodeClient) e
 * troca por ID token no servidor. Mais robusto que o ID token direto e
 * permite UI 100% custom no front.
 */
export async function loginWithGoogleCode(input: {
  code: string;
  deviceInfo?: string;
}): Promise<AuthResult> {
  let profile;
  try {
    profile = await exchangeCodeForProfile(input.code);
  } catch (err) {
    if (err instanceof GoogleAuthError) {
      throw new HttpError(err.status, err.message);
    }
    throw err;
  }
  return loginWithGoogleProfile(profile, input.deviceInfo);
}

async function loginWithGoogleProfile(
  profile: GoogleProfile,
  deviceInfo: string | undefined,
): Promise<AuthResult> {
  if (!profile.emailVerified) {
    throw new HttpError(403, 'google_email_not_verified');
  }

  const email = profile.email.trim().toLowerCase();
  let user = await prisma.user.findFirst({
    where: { OR: [{ email }, { googleId: profile.googleId }] },
    select: { id: true, email: true, name: true, createdAt: true, googleId: true },
  });

  if (!user) {
    // Cria novo user só-Google (sem senha) com trial novo
    const created = await prisma.user.create({
      data: {
        email,
        passwordHash: null,
        name: profile.name,
        googleId: profile.googleId,
        avatarUrl: profile.picture,
        trialEndsAt: computeTrialEndsAt(),
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    await ensureDefaultCategories(created.id);
    user = { ...created, googleId: profile.googleId };
  } else if (!user.googleId) {
    // Linka Google a um user existente que tinha só email/senha
    await prisma.user.update({
      where: { id: user.id },
      data: { googleId: profile.googleId, avatarUrl: profile.picture },
    });
  }

  return issueTokens(
    { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    deviceInfo,
  );
}

export async function login(input: {
  email: string;
  password: string;
  deviceInfo?: string;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, createdAt: true, passwordHash: true },
  });
  // user só-Google não tem passwordHash; cai em invalid_credentials
  // (não revelamos a existência do email pra evitar enumeration)
  if (!user || !user.passwordHash) {
    throw new HttpError(401, 'invalid_credentials');
  }

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    throw new HttpError(401, 'invalid_credentials');
  }

  const { passwordHash: _drop, ...publicUser } = user;
  return issueTokens(publicUser, input.deviceInfo);
}

export async function refresh(input: {
  refreshToken: string;
  deviceInfo?: string;
}): Promise<AuthResult> {
  const hashed = hashRefreshToken(input.refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { hashedToken: hashed },
    include: {
      user: { select: { id: true, email: true, name: true, createdAt: true } },
    },
  });

  if (!stored || stored.revokedAt || stored.expiresAt.getTime() < Date.now()) {
    // Reuse de token revogado é sinal de comprometimento — revoga toda a árvore desse usuário.
    if (stored?.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    throw new HttpError(401, 'invalid_refresh_token');
  }

  // rotação: revoga o atual, emite um novo
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return issueTokens(stored.user, input.deviceInfo ?? stored.deviceInfo ?? undefined);
}

export async function logout(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return;
  const hashed = hashRefreshToken(refreshToken);
  await prisma.refreshToken
    .updateMany({
      where: { hashedToken: hashed, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    .catch(() => undefined);
}

async function issueTokens(
  user: { id: string; email: string; name: string | null; createdAt: Date },
  deviceInfo: string | undefined,
): Promise<AuthResult> {
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const { plaintext, hashed } = generateRefreshToken();
  const refreshExpiresAt = new Date(Date.now() + expiresInMs(env.JWT_REFRESH_EXPIRES_IN));

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      hashedToken: hashed,
      deviceInfo: deviceInfo?.slice(0, 200),
      expiresAt: refreshExpiresAt,
    },
  });

  return { user, accessToken, refreshToken: plaintext, refreshExpiresAt };
}
