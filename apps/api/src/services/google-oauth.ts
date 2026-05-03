// Validação de ID tokens do Google Identity Services (GIS One Tap).
// O frontend recebe um JWT do Google, manda pra cá, e nós validamos
// assinatura + audience contra o GOOGLE_OAUTH_CLIENT_ID.

import { OAuth2Client } from 'google-auth-library';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';

export const isGoogleOAuthConfigured = (): boolean =>
  Boolean(env.GOOGLE_OAUTH_CLIENT_ID);

export const isGoogleCodeFlowConfigured = (): boolean =>
  Boolean(env.GOOGLE_OAUTH_CLIENT_ID) && Boolean(env.GOOGLE_OAUTH_CLIENT_SECRET);

if (!isGoogleOAuthConfigured()) {
  logger.warn(
    'google-oauth: GOOGLE_OAUTH_CLIENT_ID vazio — login com Google retorna 503 até configurar.',
  );
} else if (!isGoogleCodeFlowConfigured()) {
  logger.warn(
    'google-oauth: GOOGLE_OAUTH_CLIENT_SECRET vazio — exchange de code retorna 503; só ID token funciona.',
  );
}

const client = isGoogleOAuthConfigured()
  ? new OAuth2Client(env.GOOGLE_OAUTH_CLIENT_ID)
  : null;

export interface GoogleProfile {
  googleId: string; // sub do JWT
  email: string;
  name: string | null;
  picture: string | null;
  emailVerified: boolean;
}

export class GoogleAuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Valida o ID token JWT recebido do GIS no frontend e devolve o profile.
 * Lança GoogleAuthError(401) se o token não bater com o nosso client_id.
 */
export async function verifyGoogleIdToken(credential: string): Promise<GoogleProfile> {
  if (!client) {
    throw new GoogleAuthError(503, 'google_oauth_not_configured');
  }
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_OAUTH_CLIENT_ID,
    });
  } catch (err) {
    logger.warn({ err }, 'google id token rejected');
    throw new GoogleAuthError(401, 'invalid_google_token');
  }
  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new GoogleAuthError(401, 'invalid_google_payload');
  }
  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name ?? null,
    picture: payload.picture ?? null,
    emailVerified: Boolean(payload.email_verified),
  };
}

/**
 * Troca um authorization code (popup ux do GIS oauth2.initCodeClient) por
 * tokens, e valida o ID token devolvido. `redirect_uri` deve ser 'postmessage'
 * pra ux_mode=popup (não vai pro Cloud Console como redirect URI separado).
 */
export async function exchangeCodeForProfile(code: string): Promise<GoogleProfile> {
  if (!isGoogleCodeFlowConfigured()) {
    throw new GoogleAuthError(503, 'google_oauth_secret_missing');
  }

  const params = new URLSearchParams({
    code,
    client_id: env.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirect_uri: 'postmessage',
    grant_type: 'authorization_code',
  });

  let tokenResp;
  try {
    tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
  } catch (err) {
    logger.error({ err }, 'google token exchange network failure');
    throw new GoogleAuthError(502, 'google_token_exchange_failed');
  }

  if (!tokenResp.ok) {
    const body = await tokenResp.text().catch(() => '');
    logger.warn({ status: tokenResp.status, body }, 'google token exchange rejected');
    throw new GoogleAuthError(401, 'invalid_google_code');
  }

  const tokens = (await tokenResp.json().catch(() => null)) as
    | { id_token?: string; access_token?: string }
    | null;
  if (!tokens?.id_token) {
    throw new GoogleAuthError(401, 'google_id_token_missing');
  }

  return verifyGoogleIdToken(tokens.id_token);
}
