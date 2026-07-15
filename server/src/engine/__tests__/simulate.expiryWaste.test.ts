import { describe, expect, it } from 'vitest';
import { simulate } from '../simulate.js';

describe('simulate: expiry waste', () => {
  it('flags a batch that expires with stock still remaining, before it would have naturally stocked out', () => {
    const startDate = new Date('2026-01-01T00:00:00.000Z');
    // 10 units, expiring on day offset 2 (Jan 3). At 1/day, only 3 units (days 0,1,2)
    // are consumed before expiry -> 7 units wasted on day offset 3 (Jan 4).
    const batches = [
      { id: 'soon-to-expire', expiryDate: new Date('2026-01-03T00:00:00.000Z'), quantityRemaining: 10, receivedDate: startDate },
    ];

    const result = simulate(batches, { ratePerPeriod: 1, periodUnit: 'DAY' }, null, {
      startDate,
      horizonDays: 10,
      includeFutureDeliveries: false,
    });

    expect(result.expiryWasteEvents).toHaveLength(1);
    expect(result.expiryWasteEvents[0]).toMatchObject({
      batchId: 'soon-to-expire',
      wastedQuantity: 7,
    });
    expect(result.expiryWasteEvents[0].date.toISOString().slice(0, 10)).toBe('2026-01-04');

    // The waste event must be explicit, not silently folded into a bare stock-out.
    const wasteEvents = result.events.filter((e) => e.type === 'BATCH_EXPIRED_WITH_WASTE');
    expect(wasteEvents).toHaveLength(1);
  });
});
