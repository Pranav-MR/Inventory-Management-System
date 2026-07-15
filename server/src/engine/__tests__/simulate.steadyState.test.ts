import { describe, expect, it } from 'vitest';
import { simulate } from '../simulate.js';

describe('simulate: steady state (supply == consumption)', () => {
  it('never grows, never stocks out, and never warns to request a newer expiry', () => {
    const startDate = new Date('2026-01-01T00:00:00.000Z');
    const farExpiry = new Date('2035-01-01T00:00:00.000Z');
    const batches = [
      { id: 'initial', expiryDate: farExpiry, quantityRemaining: 10, receivedDate: startDate },
    ];

    const result = simulate(
      batches,
      { ratePerPeriod: 10, periodUnit: 'MONTH' },
      {
        intervalValue: 1,
        intervalUnit: 'MONTH',
        quantityPerDelivery: 10,
        nextDeliveryDate: new Date('2026-02-01T00:00:00.000Z'),
        assumedExpiryForFuture: farExpiry,
      },
      { startDate, horizonDays: 400, includeFutureDeliveries: true },
    );

    const endOfEachMonth = result.days.filter((d) => {
      const next = new Date(d.date.getTime() + 86_400_000);
      return next.getUTCDate() === 1;
    });
    for (const day of endOfEachMonth) {
      expect(day.totalRemaining).toBeCloseTo(0, 6);
    }

    expect(result.stockOutDate).toBeNull();
    expect(result.requestNewerExpiryFromDate).toBeNull();
    expect(result.expiryWasteEvents).toHaveLength(0);
  });
});
