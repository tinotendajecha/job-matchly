-- CreateEnum
CREATE TYPE "public"."DeviceType" AS ENUM ('DESKTOP', 'MOBILE', 'TABLET', 'UNKNOWN');

-- CreateTable
CREATE TABLE "public"."PageView" (
    "id" TEXT NOT NULL,
    "visitorId" VARCHAR(36) NOT NULL,
    "sessionId" VARCHAR(36),
    "path" VARCHAR(512) NOT NULL,
    "referrerHost" VARCHAR(128),
    "device" "public"."DeviceType" NOT NULL DEFAULT 'UNKNOWN',
    "country" VARCHAR(2),
    "market" "public"."MarketCode",
    "dayKey" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageView_createdAt_idx" ON "public"."PageView"("createdAt");

-- CreateIndex
CREATE INDEX "EmailDelivery_createdAt_idx" ON "public"."EmailDelivery"("createdAt");
