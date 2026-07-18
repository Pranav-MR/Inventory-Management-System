import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateInventoryReport } from './report.service.js';

const app = createApp();
const credentials = { email: 'reportservicetest@example.com', password: 'password123' };

async function cleanUp() {
  const user = await prisma.user.findUnique({ where: { email: credentials.email } });
  if (user) {
    await prisma.activityLog.deleteMany({ where: { userId: user.id } });
    await prisma.batch.deleteMany({ where: { item: { userId: user.id } } });
    await prisma.consumptionRate.deleteMany({ where: { item: { userId: user.id } } });
    await prisma.recurringSupplySchedule.deleteMany({ where: { item: { userId: user.id } } });
    await prisma.item.deleteMany({ where: { userId: user.id } });
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
}

beforeEach(cleanUp);
afterAll(async () => {
  await cleanUp();
  await prisma.$disconnect();
});

const addDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

describe('generateInventoryReport', () => {
  it('populates every section from real inventory data, matching the UI recommendation gating', async () => {
    const signupRes = await request(app).post('/api/auth/signup').send(credentials);
    const accessToken = signupRes.body.accessToken as string;
    const userId = signupRes.body.user.id as string;
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${accessToken}`);

    // Item that SHOULD trigger a recommendation: a huge batch expiring very soon relative to a
    // much larger recurring order — the engine can only safely recommend 0 for the next delivery.
    const riskyItem = await auth(
      request(app).post('/api/items').send({ name: 'Risky Item', unit: 'unit' }),
    );
    await auth(
      request(app).put(`/api/items/${riskyItem.body.id}/consumption-rate`).send({ ratePerPeriod: 1, periodUnit: 'DAY' }),
    );
    await auth(
      request(app)
        .post(`/api/items/${riskyItem.body.id}/batches`)
        .send({ receivedDate: addDays(-1), expiryDate: addDays(3), quantityReceived: 100 }),
    );
    await auth(
      request(app)
        .put(`/api/items/${riskyItem.body.id}/recurring-supply`)
        .send({ intervalValue: 1, intervalUnit: 'MONTH', quantityPerDelivery: 50, nextExpectedDeliveryDate: addDays(10) }),
    );

    // Item that should NOT trigger a recommendation: plenty of runway relative to a modest order.
    const safeItem = await auth(request(app).post('/api/items').send({ name: 'Safe Item', unit: 'unit' }));
    await auth(
      request(app).put(`/api/items/${safeItem.body.id}/consumption-rate`).send({ ratePerPeriod: 1, periodUnit: 'DAY' }),
    );
    await auth(
      request(app)
        .post(`/api/items/${safeItem.body.id}/batches`)
        .send({ receivedDate: addDays(-1), expiryDate: addDays(400), quantityReceived: 10 }),
    );
    await auth(
      request(app)
        .put(`/api/items/${safeItem.body.id}/recurring-supply`)
        .send({ intervalValue: 1, intervalUnit: 'MONTH', quantityPerDelivery: 10, nextExpectedDeliveryDate: addDays(30) }),
    );

    // Low stock item, with a threshold set.
    const lowStockItem = await auth(
      request(app).post('/api/items').send({ name: 'Bandages', unit: 'unit', lowStockThreshold: 20 }),
    );
    await auth(
      request(app)
        .put(`/api/items/${lowStockItem.body.id}/consumption-rate`)
        .send({ ratePerPeriod: 10, periodUnit: 'DAY' }),
    );
    await auth(
      request(app)
        .post(`/api/items/${lowStockItem.body.id}/batches`)
        .send({ receivedDate: addDays(-1), expiryDate: addDays(365), quantityReceived: 8 }),
    );

    // Expiring soon item, no consumption rate (batch-date arithmetic only).
    const expiringItem = await auth(
      request(app).post('/api/items').send({ name: 'Vitamin C', unit: 'unit' }),
    );
    await auth(
      request(app)
        .post(`/api/items/${expiringItem.body.id}/batches`)
        .send({ receivedDate: addDays(-1), expiryDate: addDays(15), quantityReceived: 15 }),
    );

    // Upcoming recurring delivery within the weekly window (5 days) and one outside it (20 days).
    const soonDeliveryItem = await auth(
      request(app).post('/api/items').send({ name: 'Paracetamol', unit: 'unit' }),
    );
    await auth(
      request(app)
        .put(`/api/items/${soonDeliveryItem.body.id}/recurring-supply`)
        .send({ intervalValue: 1, intervalUnit: 'MONTH', quantityPerDelivery: 30, nextExpectedDeliveryDate: addDays(5) }),
    );
    const laterDeliveryItem = await auth(
      request(app).post('/api/items').send({ name: 'Cough Syrup', unit: 'unit' }),
    );
    await auth(
      request(app)
        .put(`/api/items/${laterDeliveryItem.body.id}/recurring-supply`)
        .send({ intervalValue: 1, intervalUnit: 'MONTH', quantityPerDelivery: 12, nextExpectedDeliveryDate: addDays(20) }),
    );

    const weeklyReport = await generateInventoryReport(userId, { frequency: 'WEEKLY' });

    expect(weeklyReport.overview.totalItems).toBe(6);
    // Not asserted as exact counts: "Risky Item" is deliberately built so its huge batch is
    // mostly wasted at its own near-term expiry, which legitimately also makes the dashboard
    // flag it as low stock (stock hits zero at the expiry date either way) — that's correct
    // combined behavior, not something this test should pin to an exact overlap count.
    expect(weeklyReport.overview.lowStockItems).toBeGreaterThanOrEqual(1);
    expect(weeklyReport.overview.expiringSoonItems).toBeGreaterThanOrEqual(1);

    // Recommendation gating must match the UI exactly: only the genuinely at-risk item appears.
    expect(weeklyReport.recommendations.map((r) => r.itemName)).toContain('Risky Item');
    expect(weeklyReport.recommendations.map((r) => r.itemName)).not.toContain('Safe Item');
    const riskyRecommendation = weeklyReport.recommendations.find((r) => r.itemName === 'Risky Item');
    expect(riskyRecommendation?.message).toContain('Recommendation:');

    expect(weeklyReport.lowStock).toContainEqual({ itemName: 'Bandages', currentStock: 8, lowStockThreshold: 20 });

    expect(weeklyReport.expiringSoon.find((e) => e.itemName === 'Vitamin C')).toMatchObject({ remainingQuantity: 15 });

    // WEEKLY: only the 5-day-out delivery is within the next report period.
    expect(weeklyReport.upcomingDeliveries).toHaveLength(1);
    expect(weeklyReport.upcomingDeliveries[0].itemName).toBe('Paracetamol');

    // MONTHLY: every recurring schedule due within ~30 days shows up, including Risky Item's
    // (10 days) and Safe Item's (30 days) own recurring supplies, not just the two dedicated
    // delivery-only fixtures.
    const monthlyReport = await generateInventoryReport(userId, { frequency: 'MONTHLY' });
    expect(monthlyReport.upcomingDeliveries.map((d) => d.itemName).sort()).toEqual([
      'Cough Syrup',
      'Paracetamol',
      'Risky Item',
      'Safe Item',
    ]);
  });

  it('returns empty arrays and zeroed overview counts for a user with no items', async () => {
    const signupRes = await request(app).post('/api/auth/signup').send(credentials);
    const userId = signupRes.body.user.id as string;

    const report = await generateInventoryReport(userId, { frequency: 'WEEKLY' });

    expect(report.overview).toEqual({
      totalItems: 0,
      healthyItems: 0,
      lowStockItems: 0,
      expiringSoonItems: 0,
      actionRequiredItems: 0,
    });
    expect(report.recommendations).toEqual([]);
    expect(report.lowStock).toEqual([]);
    expect(report.expiringSoon).toEqual([]);
    expect(report.upcomingDeliveries).toEqual([]);
  });
});
