-- Migration SaaS: Google login + Admin role + Billing schema (Asaas).
-- Preservamos a coluna gerada `ftsTextPt` adicionada na migration anterior
-- de FTS — Prisma não a conhece (é raw SQL), então damos hint pro Prisma
-- ignorá-la via comentário no schema.

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('PRO_MONTHLY', 'PRO_YEARLY');

-- AlterTable: User ganha campos SaaS; passwordHash vira nullable (Google-only users)
ALTER TABLE "User"
  ADD COLUMN "asaasCustomerId" TEXT,
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "currentPeriodEndsAt" TIMESTAMP(3),
  ADD COLUMN "googleId" TEXT,
  ADD COLUMN "plan" "SubscriptionPlan",
  ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER',
  ADD COLUMN "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
  ADD COLUMN "trialEndsAt" TIMESTAMP(3),
  ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Back-fill: users existentes ganham 14 dias de trial a partir do createdAt
UPDATE "User"
   SET "trialEndsAt" = "createdAt" + interval '14 days'
 WHERE "trialEndsAt" IS NULL;

-- CreateTable: Subscription (histórico de assinaturas Asaas)
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "asaasSubscriptionId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "cancelReason" TEXT,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable: BillingEvent (log de webhooks Asaas pra debug + idempotência)
CREATE TABLE "BillingEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "asaasPaymentId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT,
    "amount" DECIMAL(10,2),
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "Subscription_asaasSubscriptionId_key" ON "Subscription"("asaasSubscriptionId");
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX "BillingEvent_userId_createdAt_idx" ON "BillingEvent"("userId", "createdAt");
CREATE INDEX "BillingEvent_asaasPaymentId_idx" ON "BillingEvent"("asaasPaymentId");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
CREATE UNIQUE INDEX "User_asaasCustomerId_key" ON "User"("asaasCustomerId");

-- Foreign Keys
ALTER TABLE "Subscription"
  ADD CONSTRAINT "Subscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BillingEvent"
  ADD CONSTRAINT "BillingEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
