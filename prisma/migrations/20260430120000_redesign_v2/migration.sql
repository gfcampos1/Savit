-- Redesign v2 (S4): priority/archivedAt/reminderMinBefore on messages,
-- icon/sortOrder on categories, and the weekly_summaries table for F6.

-- Messages: priority, soft-archive, optional reminder lead time.
ALTER TABLE "messages"
  ADD COLUMN IF NOT EXISTS "priority" TEXT,
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reminderMinBefore" INTEGER;

-- Categories: optional icon and explicit sort order.
ALTER TABLE "categories"
  ADD COLUMN IF NOT EXISTS "icon" TEXT,
  ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Weekly editorial summaries (F6).
CREATE TABLE IF NOT EXISTS "weekly_summaries" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "weekStart" TIMESTAMP(3) NOT NULL,
  "payload"   JSONB NOT NULL,
  "text"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "weekly_summaries_userId_idx"
  ON "weekly_summaries" ("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "weekly_summaries_userId_weekStart_key"
  ON "weekly_summaries" ("userId", "weekStart");
