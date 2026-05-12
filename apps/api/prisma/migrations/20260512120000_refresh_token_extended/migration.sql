-- Adiciona flag "extended" no RefreshToken pra suportar "Mantenha-me conectado".
-- Refresh tokens marcados como extended têm TTL longo (JWT_REFRESH_EXTENDED_EXPIRES_IN,
-- default 365d) e mantêm a flag em cada rotação.
ALTER TABLE "RefreshToken" ADD COLUMN "extended" BOOLEAN NOT NULL DEFAULT false;
