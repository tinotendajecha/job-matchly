-- AlterTable
ALTER TABLE "public"."IngestRun" ADD COLUMN     "meta" JSONB;

-- AlterTable
ALTER TABLE "public"."JobPost" ADD COLUMN     "lastSeenAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "JobPost_status_lastSeenAt_idx" ON "public"."JobPost"("status", "lastSeenAt");
