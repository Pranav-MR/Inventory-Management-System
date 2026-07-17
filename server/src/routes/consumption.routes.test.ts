import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

const app = createApp();
const credentials = { email: 'consumptiontest@example.com', password: 'password123' };

async function cleanUp() {
  const user = await prisma.user.findUnique({ where: { email: credentials.email } });
  if (user) {
    await prisma.consumptionAllocation.deleteMany({ where: { consumptionEntry: { item: { userId: user.id } } } });
    await prisma.consumptionEntry.deleteMany({ where: { item: { userId: user.id } } });
    await prisma.consumptionRateHistory.deleteMany({ where: { item: { userId: user.id } } });
    await prisma.activityLog.deleteMany({ where: { userId: user.id } });
    await prisma.batch.deleteMany({ where: { item: { userId: user.id } } });
    await prisma.consumptionRate.deleteMany({ where: { item: { userId: user.id } } });
    await prisma.recurringSupplySchedule.deleteMany({ where: { item: { userId: user.id } } });
    await prisma.item.deleteMany({ where: { userId: user.id } });
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
}

async function getAuthedAgent() {
  const signupRes = await request(app).post('/api/auth/signup').send(credentials);
  const accessToken = signupRes.body.accessToken as string;
  return { accessToken };
}

beforeEach(cleanUp);
afterAll(async () => {
  await cleanUp();
  await prisma.$disconnect();
});

describe('consumption log', () => {
  it('deducts via FIFO on create, correctly reverses+reallocates on edit, and fully reverses on delete', async () => {
    const { accessToken } = await getAuthedAgent();
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${accessToken}`);

    const itemRes = await auth(request(app).post('/api/items').send({ name: 'Medicine A', unit: 'tablet' }));
    const itemId = itemRes.body.id;

    // Batch A expires sooner (July 15 -> Aug 1) than Batch B (July 15 -> Dec 1), so FIFO should hit A first.
    const batchARes = await auth(
      request(app)
        .post(`/api/items/${itemId}/batches`)
        .send({ receivedDate: '2026-07-01T00:00:00.000Z', expiryDate: '2026-08-01T00:00:00.000Z', quantityReceived: 10 }),
    );
    const batchBRes = await auth(
      request(app)
        .post(`/api/items/${itemId}/batches`)
        .send({ receivedDate: '2026-07-01T00:00:00.000Z', expiryDate: '2026-12-01T00:00:00.000Z', quantityReceived: 10 }),
    );
    const batchAId = batchARes.body.id;
    const batchBId = batchBRes.body.id;

    async function getBatches() {
      const res = await auth(request(app).get(`/api/items/${itemId}/batches`));
      return {
        a: res.body.find((b: { id: string }) => b.id === batchAId),
        b: res.body.find((b: { id: string }) => b.id === batchBId),
      };
    }

    // --- Create: 15 units should drain A (10) then take 5 from B. ---
    const createRes = await auth(
      request(app).post(`/api/items/${itemId}/consumption-entries`).send({ date: '2026-07-15T00:00:00.000Z', quantity: 15 }),
    );
    expect(createRes.status).toBe(201);
    expect(createRes.body.quantity).toBe(15);
    const entryId = createRes.body.id;

    let { a, b } = await getBatches();
    expect(a.quantityRemaining).toBe(0);
    expect(a.status).toBe('DEPLETED');
    expect(b.quantityRemaining).toBe(5);
    expect(b.status).toBe('ACTIVE');

    const listRes = await auth(request(app).get(`/api/items/${itemId}/consumption-entries`));
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);

    // --- Edit down to 5 units: should fully reverse (A back to 10, B back to 10), then reallocate 5 from A. ---
    const editRes = await auth(
      request(app).patch(`/api/items/${itemId}/consumption-entries/${entryId}`).send({ quantity: 5 }),
    );
    expect(editRes.status).toBe(200);
    expect(editRes.body.quantity).toBe(5);

    ({ a, b } = await getBatches());
    expect(a.quantityRemaining).toBe(5);
    expect(a.status).toBe('ACTIVE');
    expect(b.quantityRemaining).toBe(10);

    // --- Delete: should reverse the remaining 5-unit allocation, restoring A to 10. ---
    const deleteRes = await auth(request(app).delete(`/api/items/${itemId}/consumption-entries/${entryId}`));
    expect(deleteRes.status).toBe(204);

    ({ a, b } = await getBatches());
    expect(a.quantityRemaining).toBe(10);
    expect(a.status).toBe('ACTIVE');
    expect(b.quantityRemaining).toBe(10);

    const listAfterDelete = await auth(request(app).get(`/api/items/${itemId}/consumption-entries`));
    expect(listAfterDelete.body).toHaveLength(0);
  });

  it('never changes the configured consumption rate used by projections, and tracks rate history independently', async () => {
    const { accessToken } = await getAuthedAgent();
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${accessToken}`);

    const itemRes = await auth(request(app).post('/api/items').send({ name: 'Medicine B', unit: 'tablet' }));
    const itemId = itemRes.body.id;

    await auth(request(app).put(`/api/items/${itemId}/consumption-rate`).send({ ratePerPeriod: 5, periodUnit: 'DAY' }));
    await auth(request(app).put(`/api/items/${itemId}/consumption-rate`).send({ ratePerPeriod: 8, periodUnit: 'DAY' }));

    const historyRes = await auth(request(app).get(`/api/items/${itemId}/consumption-rate/history`));
    expect(historyRes.status).toBe(200);
    expect(historyRes.body).toHaveLength(2);
    expect(historyRes.body[0].ratePerPeriod).toBe(5);
    expect(historyRes.body[1].ratePerPeriod).toBe(8);

    await auth(
      request(app)
        .post(`/api/items/${itemId}/batches`)
        .send({ receivedDate: '2026-07-01T00:00:00.000Z', expiryDate: '2027-01-01T00:00:00.000Z', quantityReceived: 100 }),
    );

    const summaryBefore = await auth(request(app).get(`/api/items/${itemId}/projection/summary`));
    expect(summaryBefore.status).toBe(200);

    // Logging consumption changes batch stock (and therefore days-of-stock-remaining),
    // but must never touch the stored rate or create additional rate-history rows.
    await auth(
      request(app).post(`/api/items/${itemId}/consumption-entries`).send({ date: '2026-07-10T00:00:00.000Z', quantity: 20 }),
    );

    const historyAfter = await auth(request(app).get(`/api/items/${itemId}/consumption-rate/history`));
    expect(historyAfter.body).toHaveLength(2);

    const summaryAfter = await auth(request(app).get(`/api/items/${itemId}/projection/summary`));
    expect(summaryAfter.body.daysOfStockRemaining).toBeLessThan(summaryBefore.body.daysOfStockRemaining);
  });
});
