-- CreateEnum
CREATE TYPE "public"."BroadcastStatus" AS ENUM ('SENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "marketingOptOut" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."EmailBroadcast" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audienceFilter" JSONB NOT NULL,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."BroadcastStatus" NOT NULL DEFAULT 'SENDING',
    "sentByEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "EmailBroadcast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailBroadcast_createdAt_idx" ON "public"."EmailBroadcast"("createdAt");
