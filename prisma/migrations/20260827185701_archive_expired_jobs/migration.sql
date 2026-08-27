-- AlterEnum
ALTER TYPE "public"."JobStatus" ADD VALUE 'ARCHIVED';

-- AlterTable
ALTER TABLE "public"."JobPost" ADD COLUMN     "closedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "JobPost_status_closedAt_idx" ON "public"."JobPost"("status", "closedAt");
