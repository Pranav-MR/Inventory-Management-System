import { describe, expect, it } from 'vitest';
import { simulate } from '../simulate.js';

describe('simulate: pure depletion, no recurring schedule', () => {
  it('reports a simple stock-out date and no expiry warnings', () => {
    const startDate = new Date('2026-01-01T00:00:00.000Z');
    const batches = [
      { id: 'only-batch', expiryDate: new Date('2030-01-01T00:00:00.000Z'), quantityRemaining: 10, receivedDate: startDate },
    ];

    const result = simulate(batches, { ratePerPeriod: 1, periodUnit: 'DAY' }, null, {
      startDate,
      horizonDays: 30,
      includeFutureDeliveries: false,
    });

    // 10 units at 1/day are fully consumed over days offset 0-9 (Jan 1 - Jan 10); the first
    // day with unmet demand (a real shortfall, not just "balance is now zero") is Jan 11.
    expect(result.stockOutDate?.toISOString().slice(0, 10)).toBe('2026-01-11');
    expect(result.expiryWasteEvents).toHaveLength(0);
    expect(result.requestNewerExpiryFromDate).toBeNull();
  });
});
