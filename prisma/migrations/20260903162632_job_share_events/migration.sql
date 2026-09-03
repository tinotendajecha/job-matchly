-- CreateTable
CREATE TABLE "public"."JobShareEvent" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobShareEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobShareEvent_jobId_kind_idx" ON "public"."JobShareEvent"("jobId", "kind");

-- CreateIndex
CREATE INDEX "JobShareEvent_createdAt_idx" ON "public"."JobShareEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."JobShareEvent" ADD CONSTRAINT "JobShareEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
