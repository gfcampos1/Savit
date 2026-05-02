-- Full-text search em PT-BR sobre Note.contentText.
-- Coluna gerada permite criar índice GIN imutável.

ALTER TABLE "Note"
  ADD COLUMN IF NOT EXISTS "ftsTextPt" tsvector
  GENERATED ALWAYS AS (to_tsvector('portuguese', coalesce("contentText", ''))) STORED;

CREATE INDEX IF NOT EXISTS "Note_ftsTextPt_idx" ON "Note" USING GIN ("ftsTextPt");
