-- AlterTable
ALTER TABLE "public"."PasswordReset" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "PasswordReset_userId_createdAt_idx" ON "public"."PasswordReset"("userId", "createdAt");
