import { describe, expect, it } from 'vitest';
import { simulate } from '../simulate.js';

describe('simulate: zero consumption rate', () => {
  it('never depletes via consumption and never stocks out, only expiry can zero it out', () => {
    const startDate = new Date('2026-01-01T00:00:00.000Z');
    const batches = [
      { id: 'seasonal', expiryDate: new Date('2030-01-01T00:00:00.000Z'), quantityRemaining: 10, receivedDate: startDate },
    ];

    const result = simulate(batches, { ratePerPeriod: 0, periodUnit: 'MONTH' }, null, {
      startDate,
      horizonDays: 30,
      includeFutureDeliveries: false,
    });

    expect(result.days[result.days.length - 1].totalRemaining).toBe(10);
    expect(result.stockOutDate).toBeNull();
    expect(result.expiryWasteEvents).toHaveLength(0);
  });
});
