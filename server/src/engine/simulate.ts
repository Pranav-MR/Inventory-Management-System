import { addDays, dateKey, generateDeliveryDates, ratePerDay, sumConsumptionCapacity, toUTCMidnight } from './dateUtils.js';
import type {
  BatchInput,
  ConsumptionRateInput,
  DayState,
  RecurringSupplyInput,
  SimulationEvent,
  SimulationOptions,
  SimulationResult,
} from './types.js';

interface InternalBatch {
  id: string;
  expiryDate: Date;
  remaining: number;
}

/**
 * Pure day-by-day simulation of stock levels for a single item.
 *
 * FIFO order is by soonest-expiry-first (not receipt order), since the goal is
 * minimizing expiry waste. The "would this delivery's expiry be met" check runs
 * exactly at intake time, which is what produces requestNewerExpiryFromDate /
 * lastAcceptableDateForCurrentExpiry.
 */
export function simulate(
  batches: BatchInput[],
  consumptionRate: ConsumptionRateInput,
  recurringSupply: RecurringSupplyInput | null,
  options: SimulationOptions,
): SimulationResult {
  const startDate = toUTCMidnight(options.startDate);
  const horizonEndDate = addDays(startDate, options.horizonDays);

  const activeBatches: InternalBatch[] = batches
    .filter((b) => b.quantityRemaining > 0)
    .map((b) => ({
      id: b.id,
      expiryDate: toUTCMidnight(b.expiryDate),
      remaining: b.quantityRemaining,
    }));

  const deliveryDates =
    recurringSupply && options.includeFutureDeliveries
      ? generateDeliveryDates(recurringSupply, startDate, horizonEndDate)
      : [];
  const deliveryDateKeys = new Set(deliveryDates.map(dateKey));

  const events: SimulationEvent[] = [];
  const days: DayState[] = [];
  const expiryWasteEvents: SimulationResult['expiryWasteEvents'] = [];
  let stockOutDate: Date | null = null;
  let requestNewerExpiryFromDate: Date | null = null;
  let lastAcceptableDateForCurrentExpiry: Date | null = null;
  let previousSafeDeliveryDate: Date | null = null;
  let deliveryCounter = 0;

  for (let offset = 0; offset <= options.horizonDays; offset++) {
    const day = addDays(startDate, offset);

    // 1. Expire batches strictly past their expiry date.
    for (const batch of activeBatches) {
      if (batch.remaining > 0 && batch.expiryDate < day) {
        events.push({ type: 'BATCH_EXPIRED_WITH_WASTE', batchId: batch.id, wastedQuantity: batch.remaining, date: day });
        expiryWasteEvents.push({ batchId: batch.id, wastedQuantity: batch.remaining, date: day });
        batch.remaining = 0;
      }
    }

    // 2. Receive a delivery if one is scheduled today.
    if (recurringSupply && deliveryDateKeys.has(dateKey(day))) {
      const candidateExpiry = toUTCMidnight(recurringSupply.assumedExpiryForFuture);
      const totalNeedingConsumptionByE =
        activeBatches
          .filter((b) => b.remaining > 0 && b.expiryDate <= candidateExpiry)
          .reduce((sum, b) => sum + b.remaining, 0) + recurringSupply.quantityPerDelivery;
      const consumableByE = sumConsumptionCapacity(consumptionRate, day, candidateExpiry);

      if (requestNewerExpiryFromDate === null) {
        if (totalNeedingConsumptionByE > consumableByE) {
          requestNewerExpiryFromDate = day;
          lastAcceptableDateForCurrentExpiry = previousSafeDeliveryDate;
          events.push({ type: 'DELIVERY_UNSAFE_FOR_CURRENT_EXPIRY', date: day, expiryDate: candidateExpiry });
        } else {
          previousSafeDeliveryDate = day;
        }
      }

      deliveryCounter += 1;
      const newBatchId = `delivery-${deliveryCounter}-${dateKey(day)}`;
      activeBatches.push({ id: newBatchId, expiryDate: candidateExpiry, remaining: recurringSupply.quantityPerDelivery });
      events.push({
        type: 'DELIVERY_RECEIVED',
        batchId: newBatchId,
        quantity: recurringSupply.quantityPerDelivery,
        date: day,
        expiryDate: candidateExpiry,
      });
    }

    // 3. Consume today's amount via FIFO, soonest-expiry-first.
    activeBatches.sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
    let toConsume = ratePerDay(consumptionRate, day);
    for (const batch of activeBatches) {
      if (toConsume <= 0) break;
      if (batch.remaining <= 0) continue;
      const take = Math.min(batch.remaining, toConsume);
      batch.remaining -= take;
      toConsume -= take;
      if (batch.remaining === 0) {
        events.push({ type: 'BATCH_DEPLETED', batchId: batch.id, date: day });
      }
    }

    // 4. Stock-out detection: a day's demand went unmet, not merely "balance is now zero"
    // (reaching exactly zero right before a scheduled delivery is not a stock-out).
    const totalRemaining = activeBatches.reduce((sum, b) => sum + b.remaining, 0);
    if (toConsume > 1e-9 && stockOutDate === null) {
      stockOutDate = day;
      events.push({ type: 'STOCK_OUT', date: day });
    }

    days.push({
      date: day,
      totalRemaining,
      perBatch: activeBatches.filter((b) => b.remaining > 0).map((b) => ({ batchId: b.id, remaining: b.remaining })),
    });
  }

  return {
    days,
    events,
    stockOutDate,
    expiryWasteEvents,
    lastAcceptableDateForCurrentExpiry,
    requestNewerExpiryFromDate,
  };
}
