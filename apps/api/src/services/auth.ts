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

export interface AuthResult {
  user: { id: string; email: string; name: string | null; createdAt: Date };
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
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
    data: { email, passwordHash, name: input.name?.trim() || null },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  await ensureDefaultCategories(user.id);

  return issueTokens(user, input.deviceInfo);
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
  if (!user) {
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
