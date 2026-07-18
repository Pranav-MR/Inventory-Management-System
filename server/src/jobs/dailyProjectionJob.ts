import type { Batch, ConsumptionRate, Item, RecurringSupplySchedule } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { simulate } from '../engine/simulate.js';
import { diffInDays, toUTCMidnight } from '../engine/dateUtils.js';
import type { BatchInput, ConsumptionRateInput } from '../engine/types.js';

type ItemWithRelations = Item & {
  consumptionRate: ConsumptionRate | null;
  recurringSupplySchedule: RecurringSupplySchedule | null;
  batches: Batch[];
};

/**
 * Ages existing batches forward from their last snapshot to today (consumption + expiry),
 * without inventing new delivery batches — recurring deliveries only become real Batch rows
 * when the user records them via "Add batch".
 */
async function rollForwardItem(item: ItemWithRelations, today: Date): Promise<void> {
  const activeBatches = item.batches.filter((b) => b.status === 'ACTIVE' && Number(b.quantityRemaining) > 0);
  if (!item.consumptionRate || activeBatches.length === 0) return;

  const startDate = toUTCMidnight(
    activeBatches.reduce((min, b) => (b.quantityAsOfDate < min ? b.quantityAsOfDate : min), activeBatches[0].quantityAsOfDate),
  );
  const elapsedDays = diffInDays(today, startDate);
  if (elapsedDays <= 0) return;

  const batchInputs: BatchInput[] = activeBatches.map((b) => ({
    id: b.id,
    expiryDate: b.expiryDate,
    quantityRemaining: Number(b.quantityRemaining),
    receivedDate: b.receivedDate,
  }));
  const consumptionRate: ConsumptionRateInput = {
    ratePerPeriod: Number(item.consumptionRate.ratePerPeriod),
    periodUnit: item.consumptionRate.periodUnit,
  };

  // simulate()'s day loop is inclusive of both endpoints, so asking for `elapsedDays - 1`
  // simulates exactly `elapsedDays` calendar days (startDate up to, but not including, today) —
  // landing on a snapshot valid "as of today, before today's own consumption," matching how
  // quantityAsOfDate is set on batch creation (receivedDate, before that day's consumption).
  const result = simulate(batchInputs, consumptionRate, null, {
    startDate,
    horizonDays: elapsedDays - 1,
    includeFutureDeliveries: false,
  });
  const finalDay = result.days[result.days.length - 1];
  const remainingByBatch = new Map(finalDay.perBatch.map((b) => [b.batchId, b.remaining]));
  const expiredBatchIds = new Set(result.expiryWasteEvents.map((e) => e.batchId));

  await prisma.$transaction(
    activeBatches.map((b) => {
      const remaining = remainingByBatch.get(b.id) ?? 0;
      const status = expiredBatchIds.has(b.id) ? 'EXPIRED' : remaining === 0 ? 'DEPLETED' : 'ACTIVE';
      return prisma.batch.update({ where: { id: b.id }, data: { quantityRemaining: remaining, quantityAsOfDate: today, status } });
    }),
  );
}

export async function runDailyProjectionJob(): Promise<void> {
  const today = toUTCMidnight(new Date());
  const items = await prisma.item.findMany({
    where: { isArchived: false },
    include: { consumptionRate: true, recurringSupplySchedule: true, batches: true },
  });

  for (const item of items) {
    await rollForwardItem(item, today);
  }
}
