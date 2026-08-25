-- CreateEnum
CREATE TYPE "public"."IngestKind" AS ENUM ('BRIEFING', 'JOBS', 'TAGGING');

-- CreateEnum
CREATE TYPE "public"."JobSource" AS ENUM ('VACANCYMAIL', 'ADZUNA');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'HIDDEN');

-- AlterTable
ALTER TABLE "public"."IngestRun" ADD COLUMN     "kind" "public"."IngestKind" NOT NULL DEFAULT 'BRIEFING';

-- CreateTable
CREATE TABLE "public"."JobPost" (
    "id" TEXT NOT NULL,
    "source" "public"."JobSource" NOT NULL,
    "sourceRef" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "companyLogo" TEXT,
    "location" TEXT,
    "market" "public"."MarketCode" NOT NULL,
    "employmentType" TEXT,
    "salaryText" TEXT,
    "description" TEXT NOT NULL,
    "bracket" TEXT,
    "sourceCategory" TEXT,
    "seniority" TEXT,
    "skills" JSONB,
    "postedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" "public"."JobStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserProfession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bracket" TEXT NOT NULL,
    "primaryRole" TEXT,
    "seniority" TEXT,
    "skills" JSONB,
    "locations" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "method" TEXT NOT NULL DEFAULT 'RULES',
    "evidence" TEXT,
    "derivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProfession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobMatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reasons" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobPost_url_key" ON "public"."JobPost"("url");

-- CreateIndex
CREATE INDEX "JobPost_market_status_postedAt_idx" ON "public"."JobPost"("market", "status", "postedAt");

-- CreateIndex
CREATE INDEX "JobPost_bracket_idx" ON "public"."JobPost"("bracket");

-- CreateIndex
CREATE UNIQUE INDEX "JobPost_source_sourceRef_key" ON "public"."JobPost"("source", "sourceRef");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfession_userId_key" ON "public"."UserProfession"("userId");

-- CreateIndex
CREATE INDEX "JobMatch_userId_score_idx" ON "public"."JobMatch"("userId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "JobMatch_userId_jobId_key" ON "public"."JobMatch"("userId", "jobId");

-- AddForeignKey
ALTER TABLE "public"."UserProfession" ADD CONSTRAINT "UserProfession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobMatch" ADD CONSTRAINT "JobMatch_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobMatch" ADD CONSTRAINT "JobMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
