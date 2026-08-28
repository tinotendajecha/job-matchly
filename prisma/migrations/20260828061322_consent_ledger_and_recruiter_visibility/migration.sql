-- CreateEnum
CREATE TYPE "public"."ConsentPurpose" AS ENUM ('ACCOUNT_TERMS', 'RECRUITER_VISIBILITY', 'MARKETING_EMAIL', 'JOB_ALERTS');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "recruiterVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recruiterVisibleAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" "public"."ConsentPurpose" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "version" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_purpose_createdAt_idx" ON "public"."ConsentRecord"("userId", "purpose", "createdAt");

-- CreateIndex
CREATE INDEX "ConsentRecord_purpose_granted_createdAt_idx" ON "public"."ConsentRecord"("purpose", "granted", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
