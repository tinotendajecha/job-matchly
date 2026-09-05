-- CreateTable
CREATE TABLE "public"."RecruiterLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "note" TEXT,
    "market" "public"."MarketCode",
    "hiresPerYear" TEXT,
    "contactedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruiterLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecruiterLead_createdAt_idx" ON "public"."RecruiterLead"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecruiterLead_email_key" ON "public"."RecruiterLead"("email");
