import { describe, expect, it } from 'vitest';
import { simulate } from '../simulate.js';

/**
 * User-reported worked example: 2 units/month supply, 1 unit/month consumption,
 * current batch expiry Sept 30, 2026.
 *
 *   Month 1 (July 2026):   received 2, consumed 1 -> remaining 1
 *   Month 2 (August 2026): + received 2 = 3, consumed 1 -> remaining 2
 *
 * The app's job is to warn, right after the August batch is recorded, that the
 * *next* delivery (September, still at the Sept-30 expiry) should not be accepted.
 * This is exactly `requestNewerExpiryFromDate` with no prior safe delivery
 * (`lastAcceptableDateForCurrentExpiry === null`) — i.e. the very first delivery
 * the forward projection evaluates from "today" is already unsafe. The two
 * sub-describes below mirror how the app actually computes this in two separate
 * simulate() calls: a historical rollforward (matching the user's own numbers)
 * and a forward-looking projection from "today" (matching what the post-add
 * check in AcceptBatchDialog actually calls).
 */
describe('simulate: next-delivery-unsafe detection (user worked example)', () => {
  const currentExpiry = new Date('2026-09-30T00:00:00.000Z');
  const consumptionRate = { ratePerPeriod: 1, periodUnit: 'MONTH' as const };

  describe('historical rollforward (July -> August), matching the user\'s own numbers', () => {
    const startDate = new Date('2026-07-01T00:00:00.000Z');
    const batches = [
      { id: 'july-batch', expiryDate: currentExpiry, quantityRemaining: 2, receivedDate: startDate },
    ];
    const recurringSupply = {
      intervalValue: 1,
      intervalUnit: 'MONTH' as const,
      quantityPerDelivery: 2,
      nextDeliveryDate: new Date('2026-08-01T00:00:00.000Z'),
      assumedExpiryForFuture: currentExpiry,
    };

    const result = simulate(batches, consumptionRate, recurringSupply, {
      startDate,
      horizonDays: 62,
      includeFutureDeliveries: true,
    });

    it('leaves 1 unit remaining at the end of July and 2 at the end of August', () => {
      const endOfJuly = result.days.find((d) => d.date.toISOString().startsWith('2026-07-31'));
      const endOfAugust = result.days.find((d) => d.date.toISOString().startsWith('2026-08-31'));
      expect(endOfJuly?.totalRemaining).toBeCloseTo(1, 6);
      expect(endOfAugust?.totalRemaining).toBeCloseTo(2, 6);
    });
  });

  describe('forward projection from "today" (Aug 31, right after recording the August batch)', () => {
    const startDate = new Date('2026-08-31T00:00:00.000Z');
    // As of today, the app only knows the current combined position (2 units,
    // Sept-30 expiry) — it doesn't re-derive how it got there.
    const batches = [
      { id: 'combined', expiryDate: currentExpiry, quantityRemaining: 2, receivedDate: startDate },
    ];
    const recurringSupply = {
      intervalValue: 1,
      intervalUnit: 'MONTH' as const,
      quantityPerDelivery: 2,
      nextDeliveryDate: new Date('2026-09-01T00:00:00.000Z'),
      assumedExpiryForFuture: currentExpiry,
    };

    const result = simulate(batches, consumptionRate, recurringSupply, {
      startDate,
      horizonDays: 60,
      includeFutureDeliveries: true,
    });

    it('flags September 1, 2026 (the very next delivery) as unsafe', () => {
      expect(result.requestNewerExpiryFromDate?.toISOString().slice(0, 10)).toBe('2026-09-01');
    });

    it('has no prior safe delivery to fall back to', () => {
      expect(result.lastAcceptableDateForCurrentExpiry).toBeNull();
    });

    it('names Sept 30, 2026 as the at-risk expiry in the unsafe-delivery event', () => {
      const unsafeEvent = result.events.find((e) => e.type === 'DELIVERY_UNSAFE_FOR_CURRENT_EXPIRY');
      expect(unsafeEvent).toBeDefined();
      expect((unsafeEvent as { expiryDate: Date }).expiryDate.toISOString().slice(0, 10)).toBe('2026-09-30');
    });
  });
});
