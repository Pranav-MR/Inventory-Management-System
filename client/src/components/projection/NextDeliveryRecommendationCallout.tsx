import { format, parseISO } from 'date-fns';
import { Info } from 'lucide-react';
import { ceilQty } from '@/lib/format';

export function describeNextDeliveryRecommendation(atRiskExpiryDate: string | null, recommendedQuantity: number): string {
  const expiryLabel = atRiskExpiryDate ? format(parseISO(atRiskExpiryDate), 'MMM d, yyyy') : 'current';
  if (recommendedQuantity === 0) {
    return `Do not accept another batch with the ${expiryLabel} expiry — request one with a later expiry date instead.`;
  }
  return `Recommendation: for the next batch, accept only ${ceilQty(recommendedQuantity)} units — accepting more may result in excess stock that cannot be consumed before the ${expiryLabel} expiry. Request a batch with a later expiry date instead.`;
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
  // Only worth surfacing when accepting the normal amount would actually cause
  // a problem — either the next batch shouldn't be accepted at all (0), or the
  // safe amount is less than what's normally ordered.
  if (nextDeliveryRecommendedQuantity === null || normalPurchaseQuantity === null) return null;
  if (nextDeliveryRecommendedQuantity >= normalPurchaseQuantity) return null;

  return (
    <div className="border-success/20 border-l-success bg-success/6 text-success flex items-center gap-3 rounded-xl border border-l-[3px] px-4 py-3.5 text-[13.5px] shadow-[0_0_24px_rgba(74,222,128,0.12)] backdrop-blur-lg">
      <Info className="size-[18px] shrink-0" />
      <span>{describeNextDeliveryRecommendation(atRiskExpiryDate, nextDeliveryRecommendedQuantity)}</span>
    </div>
  );
}
