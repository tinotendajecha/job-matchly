-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "consentGiven" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentGivenAt" TIMESTAMP(3),
ADD COLUMN     "consentVersion" TEXT;
