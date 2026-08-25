-- CreateTable
CREATE TABLE "public"."EmailDelivery" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "resendId" TEXT,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "lastEvent" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailDelivery_broadcastId_idx" ON "public"."EmailDelivery"("broadcastId");

-- AddForeignKey
ALTER TABLE "public"."EmailDelivery" ADD CONSTRAINT "EmailDelivery_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "public"."EmailBroadcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;
