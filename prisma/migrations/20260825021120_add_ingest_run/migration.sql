-- CreateEnum
CREATE TYPE "public"."IngestTrigger" AS ENUM ('MANUAL', 'CRON');

-- CreateEnum
CREATE TYPE "public"."IngestStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "public"."IngestRun" (
    "id" TEXT NOT NULL,
    "trigger" "public"."IngestTrigger" NOT NULL,
    "status" "public"."IngestStatus" NOT NULL DEFAULT 'RUNNING',
    "saved" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "IngestRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IngestRun_startedAt_idx" ON "public"."IngestRun"("startedAt");
