import { describe, expect, it } from 'vitest';
import { evaluateCandidateBatch } from '../evaluateCandidateBatch.js';

describe('evaluateCandidateBatch', () => {
  const startDate = new Date('2026-01-01T00:00:00.000Z');
  const expiry = new Date('2026-01-11T00:00:00.000Z'); // 11 consumable days: offsets 0-10

  it('flags waste when accepting the candidate would exceed what can be consumed before its expiry', () => {
    // Existing stock of 8 (same expiry) + candidate 10 = 18 total, but only 11 days * 1/day = 11 consumable.
    const existing = [{ id: 'existing', expiryDate: expiry, quantityRemaining: 8, receivedDate: startDate }];

    const result = evaluateCandidateBatch(
      existing,
      { ratePerPeriod: 1, periodUnit: 'DAY' },
      { quantity: 10, expiryDate: expiry },
      { startDate },
    );

    expect(result.wouldCauseWaste).toBe(true);
    expect(result.wastedQuantity).toBeGreaterThan(0);
    expect(result.wastedQuantity).toBeCloseTo(7, 6); // 18 total - 11 consumable = 7 wasted
  });

  it('does not flag waste when there is enough consumption capacity before expiry', () => {
    const existing = [{ id: 'existing', expiryDate: expiry, quantityRemaining: 3, receivedDate: startDate }];

    const result = evaluateCandidateBatch(
      existing,
      { ratePerPeriod: 1, periodUnit: 'DAY' },
      { quantity: 5, expiryDate: expiry },
      { startDate },
    );

    expect(result.wouldCauseWaste).toBe(false);
    expect(result.wastedQuantity).toBe(0);
    expect(result.wastedDate).toBeNull();
  });
});
