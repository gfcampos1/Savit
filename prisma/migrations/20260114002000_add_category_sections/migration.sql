-- Add category sections (grouping for categories/temas)

-- 1) Create table
CREATE TABLE IF NOT EXISTS "category_sections" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "name_hash" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "category_sections_pkey" PRIMARY KEY ("id")
);

-- 2) Foreign key to users (if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'category_sections_userId_fkey'
  ) THEN
    ALTER TABLE "category_sections"
      ADD CONSTRAINT "category_sections_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

-- 3) Ensure indexes/uniques
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'category_sections_user_id_name_hash_unique'
  ) THEN
    CREATE UNIQUE INDEX category_sections_user_id_name_hash_unique
      ON "category_sections" ("userId", "name_hash");
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS category_sections_user_id_idx ON "category_sections" ("userId");
CREATE INDEX IF NOT EXISTS category_sections_name_hash_idx ON "category_sections" ("name_hash");
CREATE INDEX IF NOT EXISTS category_sections_position_idx ON "category_sections" ("position");

-- 4) Add optional sectionId to categories
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "sectionId" TEXT;
CREATE INDEX IF NOT EXISTS categories_section_id_idx ON "categories" ("sectionId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_sectionId_fkey'
  ) THEN
    ALTER TABLE "categories"
      ADD CONSTRAINT "categories_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "category_sections"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;
