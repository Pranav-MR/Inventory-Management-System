import { describe, expect, it } from 'vitest';
import { simulate } from '../simulate.js';

/**
 * Clean hand-derived numbers using periodUnit: 'DAY' (avoids month-length noise).
 * Rate: 2/day. Candidate expiry is 9 days out from the delivery date, so
 * consumableByE = 2 * 10 days (inclusive of both endpoints) = 20 — the exact
 * capacity available to consume everything sharing that expiry before it lapses.
 *
 * nextDeliveryRecommendedQuantity = max(0, consumableByE - existingNeedingByE),
 * where existingNeedingByE excludes the scheduled delivery's own quantity — so
 * the result is independent of whatever quantityPerDelivery happens to be set to.
 */
describe('simulate: nextDeliveryRecommendedQuantity', () => {
  const startDate = new Date('2026-07-15T00:00:00.000Z');
  const candidateExpiry = new Date('2026-07-24T00:00:00.000Z'); // 9 days out
  const consumptionRate = { ratePerPeriod: 2, periodUnit: 'DAY' as const };

  function runWithExistingBatch(existingRemaining: number) {
    const batches = existingRemaining > 0
      ? [{ id: 'existing', expiryDate: candidateExpiry, quantityRemaining: existingRemaining, receivedDate: startDate }]
      : [];
    const recurringSupply = {
      intervalValue: 1,
      intervalUnit: 'DAY' as const,
      quantityPerDelivery: 16,
      nextDeliveryDate: startDate,
      assumedExpiryForFuture: candidateExpiry,
    };
    return simulate(batches, consumptionRate, recurringSupply, {
      startDate,
      horizonDays: 10,
      includeFutureDeliveries: true,
    });
  }

  it('recommends 12 units when an existing batch of 8 already shares the candidate expiry', () => {
    const result = runWithExistingBatch(8);
    expect(result.nextDeliveryRecommendedQuantity).toBeCloseTo(12, 6);
  });

  it('recommends 0 units when the existing batch of 25 already exceeds consumable capacity', () => {
    const result = runWithExistingBatch(25);
    expect(result.nextDeliveryRecommendedQuantity).toBeCloseTo(0, 6);
  });

  it('recommends the full consumable capacity of 20 units when there is no existing batch', () => {
    const result = runWithExistingBatch(0);
    expect(result.nextDeliveryRecommendedQuantity).toBeCloseTo(20, 6);
  });

  describe('with no recurring supply configured (or deactivated)', () => {
    it('falls back to the soonest active batch\'s expiry as the candidate expiry', () => {
      const batches = [
        { id: 'existing', expiryDate: candidateExpiry, quantityRemaining: 8, receivedDate: startDate },
      ];
      const result = simulate(batches, consumptionRate, null, {
        startDate,
        horizonDays: 10,
        includeFutureDeliveries: true,
      });
      // Same 8-units-existing / 20-capacity shape as the recurring-supply case above,
      // proving the recommendation no longer depends on a configured schedule.
      expect(result.nextDeliveryRecommendedQuantity).toBeCloseTo(12, 6);
    });

    it('uses the soonest of several active batches with different expiries', () => {
      const soonerExpiry = new Date('2026-07-20T00:00:00.000Z'); // 5 days out -> capacity 12
      const batches = [
        { id: 'sooner', expiryDate: soonerExpiry, quantityRemaining: 4, receivedDate: startDate },
        { id: 'later', expiryDate: candidateExpiry, quantityRemaining: 100, receivedDate: startDate },
      ];
      const result = simulate(batches, consumptionRate, null, {
        startDate,
        horizonDays: 10,
        includeFutureDeliveries: true,
      });
      // Only the sooner-expiring batch (4 units) counts toward existingNeedingByE,
      // since the later batch's expiry is past the candidate expiry being evaluated.
      expect(result.nextDeliveryRecommendedQuantity).toBeCloseTo(8, 6);
    });

    it('returns null when there are no active batches to anchor a candidate expiry to', () => {
      const result = simulate([], consumptionRate, null, {
        startDate,
        horizonDays: 10,
        includeFutureDeliveries: true,
      });
      expect(result.nextDeliveryRecommendedQuantity).toBeNull();
    });
  });
});
