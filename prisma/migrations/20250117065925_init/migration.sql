-- CreateTable
CREATE TABLE "Comparison" (
    "id" SERIAL NOT NULL,
    "item1" TEXT NOT NULL,
    "item2" TEXT NOT NULL,
    "response" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fingerprint" TEXT NOT NULL,

    CONSTRAINT "Comparison_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comparison_item1_item2_idx" ON "Comparison"("item1", "item2");
