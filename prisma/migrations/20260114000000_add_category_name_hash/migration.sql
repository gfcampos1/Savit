-- Add deterministic hash for category name (to keep uniqueness while encrypting name)
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "name_hash" TEXT;

-- Drop old uniqueness on plaintext name (won't work once names are encrypted)
DROP INDEX IF EXISTS "categories_name_userId_key";

-- Unique per user, only when populated (allows safe backfill)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'categories_user_id_name_hash_unique'
  ) THEN
    CREATE UNIQUE INDEX categories_user_id_name_hash_unique
      ON "categories" ("userId", "name_hash")
      WHERE "name_hash" IS NOT NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS categories_name_hash_idx ON "categories" ("name_hash");
