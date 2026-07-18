// Verbatim port of client/src/lib/recommendation.ts + client/src/lib/format.ts +
// the text/gating logic inlined in client/src/components/projection/NextDeliveryRecommendationCallout.tsx.
// The underlying numbers (nextDeliveryRecommendedQuantity, atRiskExpiryDate) always come from
// projection.service.ts::getProjectionSummary() — the real engine, already server-side. Only
// this pure string-formatting/gating logic is duplicated here. Keep in sync if that UI copy changes.

export function roundQty(value: number): number {
  return Math.round(value);
}

export function ceilQty(value: number): number {
  return Math.ceil(value);
}

export function getNormalPurchaseQuantity(item: {
  recurringSupplySchedule: { isActive: boolean; quantityPerDelivery: number } | null;
  batches: { receivedDate: Date; quantityReceived: number }[];
}): number | null {
  if (item.recurringSupplySchedule?.isActive) {
    return item.recurringSupplySchedule.quantityPerDelivery;
  }
  const mostRecentBatch = [...item.batches].sort(
    (a, b) => b.receivedDate.getTime() - a.receivedDate.getTime(),
  )[0];
  return mostRecentBatch?.quantityReceived ?? null;
}

export function describeNextDeliveryRecommendation(
  atRiskExpiryDate: Date | null,
  recommendedQuantity: number,
): string {
  const expiryLabel = atRiskExpiryDate
    ? ` (${new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(atRiskExpiryDate)})`
    : '';
  const quantityClause = recommendedQuantity > 0 ? `For the next batch, accept only ${ceilQty(recommendedQuantity)} units. ` : '';
  return `Recommendation: ${quantityClause}Do not accept the current expiry${expiryLabel}. Request a batch with a later expiry instead.`;
}

export function hasRecommendation(params: {
  nextDeliveryRecommendedQuantity: number | null;
  atRiskExpiryDate: Date | null;
  normalPurchaseQuantity: number | null;
}): boolean {
  if (params.nextDeliveryRecommendedQuantity === null) return false;
  const hasExpiryRisk = params.atRiskExpiryDate !== null;
  const recommendedBelowNormal =
    params.normalPurchaseQuantity !== null && params.nextDeliveryRecommendedQuantity < params.normalPurchaseQuantity;
  return hasExpiryRisk || recommendedBelowNormal;
}
