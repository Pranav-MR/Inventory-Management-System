-- CreateTable
CREATE TABLE "ConsumptionRateHistory" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "ratePerPeriod" DECIMAL(10,3) NOT NULL,
    "periodUnit" "PeriodUnit" NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsumptionRateHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumptionEntry" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsumptionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumptionAllocation" (
    "id" TEXT NOT NULL,
    "consumptionEntryId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,

    CONSTRAINT "ConsumptionAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsumptionRateHistory_itemId_effectiveFrom_idx" ON "ConsumptionRateHistory"("itemId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "ConsumptionEntry_itemId_date_idx" ON "ConsumptionEntry"("itemId", "date");

-- CreateIndex
CREATE INDEX "ConsumptionAllocation_consumptionEntryId_idx" ON "ConsumptionAllocation"("consumptionEntryId");

-- CreateIndex
CREATE INDEX "ConsumptionAllocation_batchId_idx" ON "ConsumptionAllocation"("batchId");

-- AddForeignKey
ALTER TABLE "ConsumptionRateHistory" ADD CONSTRAINT "ConsumptionRateHistory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumptionEntry" ADD CONSTRAINT "ConsumptionEntry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumptionAllocation" ADD CONSTRAINT "ConsumptionAllocation_consumptionEntryId_fkey" FOREIGN KEY ("consumptionEntryId") REFERENCES "ConsumptionEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumptionAllocation" ADD CONSTRAINT "ConsumptionAllocation_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
