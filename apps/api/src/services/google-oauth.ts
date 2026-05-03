// Validação de ID tokens do Google Identity Services (GIS One Tap).
// O frontend recebe um JWT do Google, manda pra cá, e nós validamos
// assinatura + audience contra o GOOGLE_OAUTH_CLIENT_ID.

import { OAuth2Client } from 'google-auth-library';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';

export const isGoogleOAuthConfigured = (): boolean =>
  Boolean(env.GOOGLE_OAUTH_CLIENT_ID);

if (!isGoogleOAuthConfigured()) {
  logger.warn(
    'google-oauth: GOOGLE_OAUTH_CLIENT_ID vazio — login com Google retorna 503 até configurar.',
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
