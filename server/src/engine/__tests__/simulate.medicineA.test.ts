import { describe, expect, it } from 'vitest';
import { simulate } from '../simulate.js';

/**
 * Worked example from the product spec: Medicine A is supplied 16 tablets/month,
 * consumed 10 tablets/month, current batch expiry Dec 2027. Every month 6 tablets
 * of surplus accumulate.
 *
 * Deliveries land on the 1st of each month with consumption aligned to the same
 * calendar months, so ratePerDay integrates to exactly 10 over any full month —
 * this keeps the expected numbers exact instead of leap-year/month-length noise.
 *
 * Hand-derived oracle (see PR description / planning notes for the derivation):
 *   stock_end_of_month(k) = 6 + 6k                          (k = months since Jan 2026, k=0 -> Jan)
 *   totalNeeding(k)        = 6k + 16      at delivery month k (k=1..23, Feb2026=1 .. Dec2027=23)
 *   consumableByE(k)       = (24 - k) * 10
 * First k with totalNeeding(k) > consumableByE(k) is k=15 -> April 1, 2027 delivery.
 * The prior (last safe) delivery is k=14 -> March 1, 2027.
 */
describe('simulate: Medicine A worked example', () => {
  const startDate = new Date('2026-01-01T00:00:00.000Z');
  const currentExpiry = new Date('2027-12-31T00:00:00.000Z');

  const batches = [
    { id: 'initial', expiryDate: currentExpiry, quantityRemaining: 16, receivedDate: startDate },
  ];
  const consumptionRate = { ratePerPeriod: 10, periodUnit: 'MONTH' as const };
  const recurringSupply = {
    intervalValue: 1,
    intervalUnit: 'MONTH' as const,
    quantityPerDelivery: 16,
    nextDeliveryDate: new Date('2026-02-01T00:00:00.000Z'),
    assumedExpiryForFuture: currentExpiry,
  };

  const result = simulate(batches, consumptionRate, recurringSupply, {
    startDate,
    horizonDays: 800,
    includeFutureDeliveries: true,
  });

  it('accumulates 6 tablets of surplus per month', () => {
    const endOfJan = result.days.find((d) => d.date.toISOString().startsWith('2026-01-31'));
    const endOfFeb = result.days.find((d) => d.date.toISOString().startsWith('2026-02-28'));
    const endOfMar = result.days.find((d) => d.date.toISOString().startsWith('2026-03-31'));
    expect(endOfJan?.totalRemaining).toBeCloseTo(6, 6);
    expect(endOfFeb?.totalRemaining).toBeCloseTo(12, 6);
    expect(endOfMar?.totalRemaining).toBeCloseTo(18, 6);
  });

  it('flags April 1, 2027 as the first month a newer-expiry batch should be requested', () => {
    expect(result.requestNewerExpiryFromDate?.toISOString().slice(0, 10)).toBe('2027-04-01');
  });

  it('sets the last acceptable date for the current expiry to the prior delivery, March 1, 2027', () => {
    expect(result.lastAcceptableDateForCurrentExpiry?.toISOString().slice(0, 10)).toBe('2027-03-01');
  });

  it('confirms the warning was justified: if the user ignores it and keeps accepting Dec-2027 batches, the accumulated surplus expires en masse', () => {
    // assumedExpiryForFuture is held constant at Dec 2027 for this test (the caller
    // would normally update it once the user acts on requestNewerExpiryFromDate) —
    // so every unconsumed unit shares that expiry and is wasted together.
    const totalWasted = result.expiryWasteEvents.reduce((sum, e) => sum + e.wastedQuantity, 0);
    expect(totalWasted).toBeGreaterThan(100);
    expect(result.stockOutDate).not.toBeNull();
    expect(result.stockOutDate!.getUTCFullYear()).toBe(2028);
  });
});
