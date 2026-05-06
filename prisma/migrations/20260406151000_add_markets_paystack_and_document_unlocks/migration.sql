-- CreateEnum
CREATE TYPE "public"."MarketCode" AS ENUM ('ZW', 'ZA');

-- CreateEnum
CREATE TYPE "public"."PurchaseType" AS ENUM ('CREDIT_TOPUP', 'RESUME_DOWNLOAD_UNLOCK', 'SYSTEM_BONUS');

-- AlterTable
ALTER TABLE "public"."Document"
ADD COLUMN "market" "public"."MarketCode" NOT NULL DEFAULT 'ZW',
ADD COLUMN "downloadPriceMinor" INTEGER,
ADD COLUMN "downloadCurrency" TEXT,
ADD COLUMN "unlockedAt" TIMESTAMP(3),
ADD COLUMN "unlockPurchaseId" TEXT;

-- AlterTable
ALTER TABLE "public"."Purchase"
ADD COLUMN "type" "public"."PurchaseType" NOT NULL DEFAULT 'CREDIT_TOPUP',
ADD COLUMN "market" "public"."MarketCode" NOT NULL DEFAULT 'ZW',
ADD COLUMN "documentId" TEXT,
ADD COLUMN "fulfilledAt" TIMESTAMP(3);

-- Backfill legacy purchases and documents to Zimbabwe defaults
UPDATE "public"."Purchase"
SET
  "type" = CASE
    WHEN "status" = 'BONUS' OR "provider" = 'SYSTEM' THEN 'SYSTEM_BONUS'::"public"."PurchaseType"
    ELSE 'CREDIT_TOPUP'::"public"."PurchaseType"
  END,
  "market" = 'ZW'::"public"."MarketCode";

UPDATE "public"."Document"
SET "market" = 'ZW'::"public"."MarketCode";

-- CreateIndex
CREATE UNIQUE INDEX "Document_unlockPurchaseId_key" ON "public"."Document"("unlockPurchaseId");

-- CreateIndex
CREATE INDEX "Document_market_idx" ON "public"."Document"("market");

-- CreateIndex
CREATE INDEX "Purchase_market_type_createdAt_idx" ON "public"."Purchase"("market", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Purchase_documentId_idx" ON "public"."Purchase"("documentId");

-- AddForeignKey
ALTER TABLE "public"."Document"
ADD CONSTRAINT "Document_unlockPurchaseId_fkey"
FOREIGN KEY ("unlockPurchaseId")
REFERENCES "public"."Purchase"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Purchase"
ADD CONSTRAINT "Purchase_documentId_fkey"
FOREIGN KEY ("documentId")
REFERENCES "public"."Document"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
