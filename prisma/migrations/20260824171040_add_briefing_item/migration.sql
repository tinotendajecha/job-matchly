-- CreateEnum
CREATE TYPE "public"."BriefingSource" AS ENUM ('REDDIT', 'QUORA', 'LINKEDIN', 'NEWSLETTER', 'ARTICLE');

-- CreateEnum
CREATE TYPE "public"."BriefingStatus" AS ENUM ('PUBLISHED', 'HIDDEN');

-- CreateTable
CREATE TABLE "public"."BriefingItem" (
    "id" TEXT NOT NULL,
    "source" "public"."BriefingSource" NOT NULL,
    "sourceDetail" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "image" TEXT,
    "readTime" TEXT NOT NULL,
    "stat" TEXT,
    "url" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."BriefingStatus" NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BriefingItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BriefingItem_url_key" ON "public"."BriefingItem"("url");

-- CreateIndex
CREATE INDEX "BriefingItem_status_featured_createdAt_idx" ON "public"."BriefingItem"("status", "featured", "createdAt");

-- CreateIndex
CREATE INDEX "BriefingItem_category_idx" ON "public"."BriefingItem"("category");
