import { format, parseISO } from 'date-fns';
import { Info } from 'lucide-react';
import { ceilQty } from '@/lib/format';

export function describeNextDeliveryRecommendation(atRiskExpiryDate: string | null, recommendedQuantity: number): string {
  const expiryLabel = atRiskExpiryDate ? ` (${format(parseISO(atRiskExpiryDate), 'MMMM yyyy')})` : '';
  const quantityClause = recommendedQuantity > 0 ? `For the next batch, accept only ${ceilQty(recommendedQuantity)} units. ` : '';
  return `Recommendation: ${quantityClause}Do not accept the current expiry${expiryLabel}. Request a batch with a later expiry instead.`;
}

export function NextDeliveryRecommendationCallout({
  atRiskExpiryDate,
  nextDeliveryRecommendedQuantity,
  normalPurchaseQuantity,
}: {
  atRiskExpiryDate: string | null;
  nextDeliveryRecommendedQuantity: number | null;
  normalPurchaseQuantity: number | null;
}) {
  if (nextDeliveryRecommendedQuantity === null) return null;

  const hasExpiryRisk = atRiskExpiryDate !== null;
  const recommendedBelowNormal =
    normalPurchaseQuantity !== null && nextDeliveryRecommendedQuantity < normalPurchaseQuantity;
  if (!hasExpiryRisk && !recommendedBelowNormal) return null;

  return (
    <div className="border-foreground/25 border-l-foreground bg-foreground/5 text-foreground flex items-center gap-3 rounded-xl border border-l-[3px] px-4 py-3.5 text-[13.5px] shadow-[0_0_20px_rgba(0,0,0,0.06)] backdrop-blur-lg dark:shadow-none">
      <Info className="size-[18px] shrink-0" />
      <span>{describeNextDeliveryRecommendation(atRiskExpiryDate, nextDeliveryRecommendedQuantity)}</span>
    </div>
  );
}
