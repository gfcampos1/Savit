import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from './env.js';

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const opts: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: 'savit',
  };
  return jwt.sign(payload, env.JWT_SECRET, opts);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, { issuer: 'savit' });
  if (typeof decoded === 'string' || !decoded.sub || typeof decoded.sub !== 'string') {
    throw new Error('invalid token payload');
  }
  return { sub: decoded.sub, email: (decoded as jwt.JwtPayload).email as string };
}

// Refresh token = opaque random; armazenamos só o hash. JWT desnecessário aqui.
export function generateRefreshToken(): { plaintext: string; hashed: string } {
  const plaintext = crypto.randomBytes(48).toString('base64url');
  const hashed = crypto.createHash('sha256').update(plaintext).digest('hex');
  return { plaintext, hashed };
}

export function hashRefreshToken(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext).digest('hex');
}

// Converte "30d" / "15m" / "1h" em ms (subset das strings que jwt aceita).
export function expiresInMs(spec: string): number {
  const m = spec.match(/^(\d+)([smhdw])$/);
  if (!m) throw new Error(`invalid duration spec: ${spec}`);
  const n = Number(m[1]);
  const unit = m[2];
  const mult = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 }[unit!]!;
  return n * mult;
}
