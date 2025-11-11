-- AlterTable
ALTER TABLE "public"."Profile" ADD COLUMN     "resumeFileName" TEXT,
ADD COLUMN     "resumeMarkdown" TEXT,
ADD COLUMN     "resumeUpdatedAt" TIMESTAMP(3);
