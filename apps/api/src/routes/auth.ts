import { Router } from 'express';
import { z } from 'zod';
import { LoginInput, RegisterInput } from '@savit/shared';
import { env } from '../lib/env.js';
import { expiresInMs } from '../lib/jwt.js';
import {
  login,
  loginWithGoogle,
  loginWithGoogleCode,
  logout,
  refresh,
  register,
} from '../services/auth.js';
import type { AuthResult } from '../services/auth.js';

export const authRouter: Router = Router();

const REFRESH_COOKIE = 'savit_rt';

function setRefreshCookie(
  res: Parameters<Router['use']>[0] extends never ? never : import('express').Response,
  refreshToken: string,
  expiresAt: Date,
) {
  // domain só é setado se COOKIE_DOMAIN for explícito (ex: '.savit.com' pra
  // compartilhar entre subdomínios). Default = host-only, que funciona em
  // qualquer domínio sem precisar de config (Railway, custom domain, etc.).
  const explicitDomain =
    env.NODE_ENV === 'production' && env.COOKIE_DOMAIN && env.COOKIE_DOMAIN !== 'localhost'
      ? env.COOKIE_DOMAIN
      : undefined;
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    ...(explicitDomain && { domain: explicitDomain }),
    expires: expiresAt,
    path: '/api/auth',
  });
}

function clearRefreshCookie(res: import('express').Response) {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
}

function publicResponse(result: AuthResult) {
  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      createdAt: result.user.createdAt.toISOString(),
    },
    accessToken: result.accessToken,
    accessExpiresInMs: expiresInMs(env.JWT_ACCESS_EXPIRES_IN),
  };
}

function deviceInfoFrom(req: import('express').Request): string {
  return (req.headers['user-agent'] ?? '').toString().slice(0, 200);
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const input = RegisterInput.parse(req.body);
    const result = await register({ ...input, deviceInfo: deviceInfoFrom(req) });
    setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
    res.status(201).json(publicResponse(result));
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const input = LoginInput.parse(req.body);
    const result = await login({ ...input, deviceInfo: deviceInfoFrom(req) });
    setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
    res.json(publicResponse(result));
  } catch (err) {
    next(err);
  }
});

// Schema dos endpoints Google — credential/code + flag opcional rememberMe.
const RememberMeFlag = z.object({ rememberMe: z.boolean().optional() });

// Config público pro front saber quais providers de auth estão disponíveis
// sem depender de VITE_* em build time. Cacheável (5min).
authRouter.get('/config', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json({
    googleClientId: env.GOOGLE_OAUTH_CLIENT_ID || null,
  });
});

const GoogleLoginInput = z
  .object({
    credential: z.string().min(20).max(8192),
  })
  .merge(RememberMeFlag);

authRouter.post('/google', async (req, res, next) => {
  try {
    const { credential, rememberMe } = GoogleLoginInput.parse(req.body);
    const result = await loginWithGoogle({
      credential,
      deviceInfo: deviceInfoFrom(req),
      rememberMe,
    });
    setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
    res.json(publicResponse(result));
  } catch (err) {
    next(err);
  }
});

const GoogleCodeInput = z
  .object({
    code: z.string().min(10).max(2048),
  })
  .merge(RememberMeFlag);

authRouter.post('/google/exchange', async (req, res, next) => {
  try {
    const { code, rememberMe } = GoogleCodeInput.parse(req.body);
    const result = await loginWithGoogleCode({
      code,
      deviceInfo: deviceInfoFrom(req),
      rememberMe,
    });
    setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
    res.json(publicResponse(result));
  } catch (err) {
    next(err);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const cookieToken = (req.cookies?.[REFRESH_COOKIE] as string | undefined) ?? '';
    if (!cookieToken) {
      res.status(401).json({ error: 'missing_refresh_token' });
      return;
    }
    const result = await refresh({ refreshToken: cookieToken, deviceInfo: deviceInfoFrom(req) });
    setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
    res.json(publicResponse(result));
  } catch (err) {
    clearRefreshCookie(res);
    next(err);
  }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    const cookieToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await logout(cookieToken);
    clearRefreshCookie(res);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
