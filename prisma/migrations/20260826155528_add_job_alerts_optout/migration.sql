-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "jobAlertsOptOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastJobDigestAt" TIMESTAMP(3);
