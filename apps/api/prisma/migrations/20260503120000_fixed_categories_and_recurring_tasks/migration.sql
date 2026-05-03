-- Migration: categorias fixas (Livros, YouTube), metadata em Note,
-- e RecurringTask (recorrência semanal) com link Task.recurringTaskId.
--
-- Backfill ao final: garante que todo usuário existente tenha as categorias
-- fixas 'books' e 'youtube' criadas (idempotente via ON CONFLICT do índice
-- (userId, slug)).

-- =====================================================================
-- Category: slug + hiddenAt
-- =====================================================================

ALTER TABLE "Category"
  ADD COLUMN "slug"     TEXT,
  ADD COLUMN "hiddenAt" TIMESTAMP(3);

-- slug único por usuário (apenas onde não nulo — comportamento padrão do PG)
CREATE UNIQUE INDEX "Category_userId_slug_key" ON "Category"("userId", "slug");

-- =====================================================================
-- Note: metadata Json
-- =====================================================================

ALTER TABLE "Note"
  ADD COLUMN "metadata" JSONB;

-- =====================================================================
-- Task: recurringTaskId (FK criada após RecurringTask)
-- =====================================================================

ALTER TABLE "Task"
  ADD COLUMN "recurringTaskId" TEXT;

CREATE INDEX "Task_recurringTaskId_idx" ON "Task"("recurringTaskId");

-- =====================================================================
-- RecurringTask
-- =====================================================================

CREATE TABLE "RecurringTask" (
    "id"          TEXT          NOT NULL,
    "userId"      TEXT          NOT NULL,
    "categoryId"  TEXT,
    "title"       TEXT          NOT NULL,
    "description" TEXT,
    "priority"    TEXT,
    "weekday"     INTEGER       NOT NULL,
    "isActive"    BOOLEAN       NOT NULL DEFAULT true,
    "nextRunAt"   TIMESTAMP(3)  NOT NULL,
    "lastRunAt"   TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3)  NOT NULL,

    CONSTRAINT "RecurringTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RecurringTask_userId_isActive_nextRunAt_idx"
  ON "RecurringTask"("userId", "isActive", "nextRunAt");
CREATE INDEX "RecurringTask_categoryId_idx" ON "RecurringTask"("categoryId");

ALTER TABLE "RecurringTask"
  ADD CONSTRAINT "RecurringTask_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecurringTask"
  ADD CONSTRAINT "RecurringTask_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- FK do Task.recurringTaskId agora que RecurringTask existe
ALTER TABLE "Task"
  ADD CONSTRAINT "Task_recurringTaskId_fkey"
  FOREIGN KEY ("recurringTaskId") REFERENCES "RecurringTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================================
-- Backfill: cria categorias fixas para todos os usuários existentes.
-- Idempotente: ON CONFLICT no índice (userId, slug) ignora se já existir.
-- A geração de id usa gen_random_uuid() do pgcrypto (nativo no PG 13+).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO "Category" ("id", "userId", "name", "color", "icon", "sortOrder", "slug", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  u."id",
  'Livros',
  '#7a5cc7',
  'book',
  100,
  'books',
  NOW(),
  NOW()
FROM "User" u
ON CONFLICT ("userId", "slug") DO NOTHING;

INSERT INTO "Category" ("id", "userId", "name", "color", "icon", "sortOrder", "slug", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  u."id",
  'YouTube',
  '#c0563a',
  'play',
  101,
  'youtube',
  NOW(),
  NOW()
FROM "User" u
ON CONFLICT ("userId", "slug") DO NOTHING;
