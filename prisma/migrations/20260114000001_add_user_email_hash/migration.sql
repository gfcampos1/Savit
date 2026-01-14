-- Add deterministic hash for user email and remove unique on plaintext email
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_hash" TEXT;

-- Drop old uniqueness on plaintext email (won't work once emails are encrypted)
DROP INDEX IF EXISTS "users_email_key";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'users_email_hash_unique'
  ) THEN
    CREATE UNIQUE INDEX users_email_hash_unique
      ON "users" ("email_hash")
      WHERE "email_hash" IS NOT NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS users_email_hash_idx ON "users" ("email_hash");
