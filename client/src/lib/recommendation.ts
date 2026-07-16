import type { Item } from '../types/item';

/**
 * The quantity a user "normally" orders for this item — the baseline the
 * next-delivery recommendation is judged against. An active recurring supply
 * schedule's quantityPerDelivery is the authoritative answer; without one,
 * fall back to the most recently received batch as a proxy for typical order size.
 */
export function getNormalPurchaseQuantity(item: Item): number | null {
  if (item.recurringSupplySchedule?.isActive) {
    return item.recurringSupplySchedule.quantityPerDelivery;
  }
  const mostRecentBatch = [...item.batches].sort(
    (a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime(),
  )[0];
  return mostRecentBatch?.quantityReceived ?? null;
}
