import type { Batch, ConsumptionRate, Item, NotificationPreference, RecurringSupplySchedule } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { simulate } from '../engine/simulate.js';
import { diffInDays, toUTCMidnight } from '../engine/dateUtils.js';
import type { BatchInput, ConsumptionRateInput } from '../engine/types.js';
import { getProjection, evaluateCandidate } from '../services/projection.service.js';
import { dispatchNotification } from '../services/notification.service.js';

type ItemWithRelations = Item & {
  consumptionRate: ConsumptionRate | null;
  recurringSupplySchedule: RecurringSupplySchedule | null;
  batches: Batch[];
};

const DEFAULT_LEAD_DAYS: Record<string, number> = {
  LOW_STOCK: 7,
  STOCK_OUT_IMMINENT: 3,
  REQUEST_NEWER_BATCH: 14,
  UPCOMING_DELIVERY_REMINDER: 3,
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

async function evaluateAndNotifyForItem(
  userId: string,
  item: ItemWithRelations,
  prefsByEvent: Map<string, NotificationPreference>,
  today: Date,
): Promise<void> {
  const leadDays = (eventType: string) => prefsByEvent.get(eventType)?.leadTimeDays ?? DEFAULT_LEAD_DAYS[eventType];
  const isEnabled = (eventType: string) => prefsByEvent.get(eventType)?.isEnabled ?? true;

  let projection;
  try {
    projection = await getProjection(userId, item.id, { horizonDays: 365, includeFutureDeliveries: true });
  } catch {
    return; // consumption rate not set yet
  }

  if (projection.stockOutDate) {
    const daysUntilStockOut = diffInDays(toUTCMidnight(projection.stockOutDate), today);
    if (isEnabled('LOW_STOCK') && daysUntilStockOut <= leadDays('LOW_STOCK')) {
      await dispatchNotification({
        userId,
        itemId: item.id,
        eventType: 'LOW_STOCK',
        context: { itemName: item.name, unit: item.unit, daysOfStockRemaining: daysUntilStockOut },
      });
    }
    if (isEnabled('STOCK_OUT_IMMINENT') && daysUntilStockOut <= leadDays('STOCK_OUT_IMMINENT')) {
      await dispatchNotification({
        userId,
        itemId: item.id,
        eventType: 'STOCK_OUT_IMMINENT',
        context: { itemName: item.name, unit: item.unit, stockOutDate: projection.stockOutDate.toISOString().slice(0, 10) },
      });
    }
  }

  if (isEnabled('EXPIRY_WASTE_WARNING') && projection.expiryWasteEvents.length > 0) {
    await dispatchNotification({
      userId,
      itemId: item.id,
      eventType: 'EXPIRY_WASTE_WARNING',
      context: { itemName: item.name, unit: item.unit },
    });
  }

  if (projection.requestNewerExpiryFromDate && isEnabled('REQUEST_NEWER_BATCH')) {
    const daysUntil = diffInDays(toUTCMidnight(projection.requestNewerExpiryFromDate), today);
    if (daysUntil <= leadDays('REQUEST_NEWER_BATCH')) {
      await dispatchNotification({
        userId,
        itemId: item.id,
        eventType: 'REQUEST_NEWER_BATCH',
        context: {
          itemName: item.name,
          unit: item.unit,
          requestNewerExpiryFromDate: projection.requestNewerExpiryFromDate.toISOString().slice(0, 10),
        },
      });
    }
  }

  const schedule = item.recurringSupplySchedule;
  if (schedule?.isActive) {
    const nextDelivery = toUTCMidnight(schedule.nextExpectedDeliveryDate);
    const daysUntilDelivery = diffInDays(nextDelivery, today);
    const withinDeliveryLead = daysUntilDelivery >= 0 && daysUntilDelivery <= leadDays('UPCOMING_DELIVERY_REMINDER');

    if (isEnabled('UPCOMING_DELIVERY_REMINDER') && withinDeliveryLead) {
      await dispatchNotification({
        userId,
        itemId: item.id,
        eventType: 'UPCOMING_DELIVERY_REMINDER',
        context: { itemName: item.name, unit: item.unit, nextDeliveryDate: nextDelivery.toISOString().slice(0, 10) },
      });
    }

    if (item.consumptionRate && isEnabled('CANDIDATE_BATCH_WASTE_WARNING') && withinDeliveryLead) {
      const assumedExpiry =
        schedule.assumedExpiryForFuture ??
        [...item.batches]
          .filter((b) => Number(b.quantityRemaining) > 0)
          .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())[0]?.expiryDate;

      if (assumedExpiry) {
        const candidateResult = await evaluateCandidate(userId, item.id, {
          quantity: Number(schedule.quantityPerDelivery),
          expiryDate: assumedExpiry,
        });
        if (candidateResult.wouldCauseWaste) {
          await dispatchNotification({
            userId,
            itemId: item.id,
            eventType: 'CANDIDATE_BATCH_WASTE_WARNING',
            context: { itemName: item.name, unit: item.unit, wastedQuantity: candidateResult.wastedQuantity },
          });
        }
      }
    }
  }
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

  const itemsByUser = new Map<string, ItemWithRelations[]>();
  for (const item of items) {
    if (!itemsByUser.has(item.userId)) itemsByUser.set(item.userId, []);
    itemsByUser.get(item.userId)!.push(item);
  }

  for (const [userId, userItems] of itemsByUser) {
    const prefRows = await prisma.notificationPreference.findMany({ where: { userId } });
    const prefsByEvent = new Map(prefRows.map((p) => [p.eventType, p]));

    for (const item of userItems) {
      await evaluateAndNotifyForItem(userId, item, prefsByEvent, today);
    }
  }
}
