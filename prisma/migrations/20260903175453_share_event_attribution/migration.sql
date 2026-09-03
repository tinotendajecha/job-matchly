-- DropIndex
DROP INDEX "public"."JobShareEvent_createdAt_idx";

-- AlterTable
ALTER TABLE "public"."JobShareEvent" ADD COLUMN     "referrerHost" VARCHAR(128),
ADD COLUMN     "visitorId" VARCHAR(36);

-- CreateIndex
CREATE INDEX "JobShareEvent_kind_createdAt_idx" ON "public"."JobShareEvent"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "JobShareEvent_visitorId_idx" ON "public"."JobShareEvent"("visitorId");
