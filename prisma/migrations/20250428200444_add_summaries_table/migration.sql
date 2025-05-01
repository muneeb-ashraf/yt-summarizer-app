-- CreateTable
CREATE TABLE "summaries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "youtube_url" TEXT NOT NULL,
    "summary_content" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "summaries_user_id_idx" ON "summaries"("user_id");
