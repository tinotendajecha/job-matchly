-- Remove CREDIT_TOPUP from PurchaseType enum
-- First update any existing CREDIT_TOPUP rows to SYSTEM_BONUS
UPDATE "public"."Purchase" SET "type" = 'SYSTEM_BONUS' WHERE "type" = 'CREDIT_TOPUP';

-- AlterEnum: remove CREDIT_TOPUP value
ALTER TYPE "public"."PurchaseType" RENAME TO "PurchaseType_old";
CREATE TYPE "public"."PurchaseType" AS ENUM ('RESUME_DOWNLOAD_UNLOCK', 'SYSTEM_BONUS');
ALTER TABLE "public"."Purchase" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "public"."Purchase" ALTER COLUMN "type" TYPE "public"."PurchaseType" USING ("type"::text::"public"."PurchaseType");
ALTER TABLE "public"."Purchase" ALTER COLUMN "type" SET DEFAULT 'RESUME_DOWNLOAD_UNLOCK';
DROP TYPE "public"."PurchaseType_old";

-- AlterTable: remove credits column from Purchase
ALTER TABLE "public"."Purchase" DROP COLUMN IF EXISTS "credits";

-- AlterTable: remove credits column from User
ALTER TABLE "public"."User" DROP COLUMN IF EXISTS "credits";

-- DropTable: remove Ledger table
DROP TABLE IF EXISTS "public"."Ledger";
