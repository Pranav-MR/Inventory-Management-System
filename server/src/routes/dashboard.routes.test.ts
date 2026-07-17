import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

const app = createApp();
const credentials = { email: 'dashboardtest@example.com', password: 'password123' };

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

describe('dashboard summary', () => {
  it('counts low-stock items and ignores items without a consumption rate', async () => {
    const signupRes = await request(app).post('/api/auth/signup').send(credentials);
    const accessToken = signupRes.body.accessToken as string;
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${accessToken}`);

    const withRate = await auth(request(app).post('/api/items').send({ name: 'Low Stock Item', unit: 'unit' }));
    await auth(
      request(app).put(`/api/items/${withRate.body.id}/consumption-rate`).send({ ratePerPeriod: 1, periodUnit: 'DAY' }),
    );
    await auth(
      request(app)
        .post(`/api/items/${withRate.body.id}/batches`)
        .send({
          receivedDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 365 * 86_400_000).toISOString(),
          quantityReceived: 3,
        }),
    );

    await auth(request(app).post('/api/items').send({ name: 'No Rate Item', unit: 'unit' }));

    const summaryRes = await auth(request(app).get('/api/dashboard/summary'));
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.totalItems).toBe(2);
    expect(summaryRes.body.lowStockCount).toBe(1);
  });
});

describe('dashboard overview', () => {
  it('aggregates expiring-soon, low-stock, upcoming recurring, activity, and overview stats', async () => {
    const signupRes = await request(app).post('/api/auth/signup').send(credentials);
    const accessToken = signupRes.body.accessToken as string;
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${accessToken}`);
    const addDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

    // Expiring today, with no consumption rate set — must still surface (batch-date arithmetic only).
    const expiringToday = await auth(
      request(app).post('/api/items').send({ name: 'No Rate Expiring Item', unit: 'unit' }),
    );
    await auth(
      request(app)
        .post(`/api/items/${expiringToday.body.id}/batches`)
        .send({ receivedDate: addDays(-1), expiryDate: addDays(0), quantityReceived: 5 }),
    );

    // Expiring later (20 days), still within the 30-day horizon, in the LATER bucket.
    const expiringLater = await auth(
      request(app).post('/api/items').send({ name: 'Later Expiring Item', unit: 'unit' }),
    );
    await auth(
      request(app)
        .post(`/api/items/${expiringLater.body.id}/batches`)
        .send({ receivedDate: addDays(-1), expiryDate: addDays(20), quantityReceived: 7 }),
    );

    // Low stock: consuming fast, batch expiry far away so it doesn't also land in expiringSoon.
    const lowStockItem = await auth(request(app).post('/api/items').send({ name: 'Low Stock Item', unit: 'unit' }));
    await auth(
      request(app)
        .put(`/api/items/${lowStockItem.body.id}/consumption-rate`)
        .send({ ratePerPeriod: 10, periodUnit: 'DAY' }),
    );
    await auth(
      request(app)
        .post(`/api/items/${lowStockItem.body.id}/batches`)
        .send({ receivedDate: addDays(-1), expiryDate: addDays(365), quantityReceived: 5 }),
    );

    // Upcoming recurring supply, 10 days out.
    const recurringItem = await auth(request(app).post('/api/items').send({ name: 'Recurring Item', unit: 'unit' }));
    await auth(
      request(app)
        .put(`/api/items/${recurringItem.body.id}/recurring-supply`)
        .send({ intervalValue: 1, intervalUnit: 'MONTH', quantityPerDelivery: 20, nextExpectedDeliveryDate: addDays(10) }),
    );

    // Archived item — must be excluded from every section and counted separately.
    const archivedItem = await auth(request(app).post('/api/items').send({ name: 'Archived Item', unit: 'unit' }));
    await auth(request(app).delete(`/api/items/${archivedItem.body.id}`));

    const res = await auth(request(app).get('/api/dashboard/overview'));
    expect(res.status).toBe(200);

    expect(res.body.summary.totalItems).toBe(4);
    expect(res.body.summary.expiringSoonCount).toBe(2);
    expect(res.body.summary.lowStockCount).toBe(1);

    expect(res.body.expiringSoon).toHaveLength(2);
    expect(res.body.expiringSoon[0]).toMatchObject({ itemName: 'No Rate Expiring Item', group: 'TODAY', affectedQuantity: 5 });
    expect(res.body.expiringSoon[1]).toMatchObject({ itemName: 'Later Expiring Item', group: 'LATER', affectedQuantity: 7 });

    expect(res.body.lowStock).toHaveLength(1);
    expect(res.body.lowStock[0]).toMatchObject({ itemName: 'Low Stock Item', currentQuantity: 5 });

    expect(res.body.upcomingRecurring).toHaveLength(1);
    expect(res.body.upcomingRecurring[0]).toMatchObject({ itemName: 'Recurring Item', quantityPerDelivery: 20 });
    expect(res.body.upcomingRecurring[0].daysUntil).toBeCloseTo(10, 0);

    expect(res.body.overview.totalActiveItems).toBe(4);
    expect(res.body.overview.archivedItems).toBe(1);
    expect(res.body.overview.totalBatches).toBe(3);
    expect(res.body.overview.lastInventoryUpdate).not.toBeNull();

    expect(res.body.filterItemIds.expiringSoon.sort()).toEqual(
      [expiringToday.body.id, expiringLater.body.id].sort(),
    );
    expect(res.body.filterItemIds.lowStock).toEqual([lowStockItem.body.id]);

    // Recent activity: capped at 50, most-recent-first, and the very last action (archiving) leads.
    expect(res.body.recentActivity.length).toBe(9);
    expect(res.body.recentActivity[0].type).toBe('ITEM_ARCHIVED');
    expect(res.body.recentActivity[0].itemName).toBe('Archived Item');
    const timestamps = res.body.recentActivity.map((a: { createdAt: string }) => new Date(a.createdAt).getTime());
    expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
  });
});
