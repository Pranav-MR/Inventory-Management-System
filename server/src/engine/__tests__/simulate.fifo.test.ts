import { describe, expect, it } from 'vitest';
import { simulate } from '../simulate.js';

describe('simulate: FIFO by soonest expiry', () => {
  it('drains the soonest-expiry batch fully before touching the later one, regardless of input order', () => {
    const startDate = new Date('2026-01-01T00:00:00.000Z');
    const batches = [
      // Later-expiry batch listed first in the input on purpose, to prove sort order matters, not array order.
      { id: 'B-later', expiryDate: new Date('2026-01-21T00:00:00.000Z'), quantityRemaining: 5, receivedDate: startDate },
      { id: 'A-sooner', expiryDate: new Date('2026-01-11T00:00:00.000Z'), quantityRemaining: 5, receivedDate: startDate },
    ];

    const result = simulate(batches, { ratePerPeriod: 1, periodUnit: 'DAY' }, null, {
      startDate,
      horizonDays: 15,
      includeFutureDeliveries: false,
    });

    // Days 0-4 (5 days) consume A-sooner entirely (1/day * 5 = 5).
    expect(result.days[4].perBatch.find((b) => b.batchId === 'A-sooner')).toBeUndefined();
    expect(result.days[4].perBatch.find((b) => b.batchId === 'B-later')?.remaining).toBe(5);

    // Day 5 onward starts draining B-later.
    expect(result.days[5].perBatch.find((b) => b.batchId === 'B-later')?.remaining).toBe(4);

    const depletedEvents = result.events.filter((e) => e.type === 'BATCH_DEPLETED');
    expect(depletedEvents.map((e) => (e as { batchId: string }).batchId)).toEqual(['A-sooner', 'B-later']);
  });
});
