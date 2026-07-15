import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

const app = createApp();

const credentials = { email: 'projectiontest@example.com', password: 'password123' };

async function cleanUp() {
  const user = await prisma.user.findUnique({ where: { email: credentials.email } });
  if (user) {
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

describe('projection endpoints', () => {
  it('rejects projection when no consumption rate is set', async () => {
    const { accessToken } = await getAuthedAgent();
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${accessToken}`);

    const itemRes = await auth(request(app).post('/api/items').send({ name: 'Medicine A', unit: 'tablet' }));
    const itemId = itemRes.body.id;

    const res = await auth(request(app).get(`/api/items/${itemId}/projection`));
    expect(res.status).toBe(422);
  });

  it('computes a full projection and summary matching the Medicine A worked example via the API', async () => {
    const { accessToken } = await getAuthedAgent();
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${accessToken}`);

    const itemRes = await auth(request(app).post('/api/items').send({ name: 'Medicine A', unit: 'tablet' }));
    const itemId = itemRes.body.id;

    await auth(
      request(app).put(`/api/items/${itemId}/consumption-rate`).send({ ratePerPeriod: 10, periodUnit: 'MONTH' }),
    );
    await auth(
      request(app)
        .put(`/api/items/${itemId}/recurring-supply`)
        .send({
          intervalValue: 1,
          intervalUnit: 'MONTH',
          quantityPerDelivery: 16,
          nextExpectedDeliveryDate: '2026-08-01T00:00:00.000Z',
        }),
    );
    await auth(
      request(app)
        .post(`/api/items/${itemId}/batches`)
        .send({
          receivedDate: '2026-07-15T00:00:00.000Z',
          expiryDate: '2027-12-31T00:00:00.000Z',
          quantityReceived: 16,
        }),
    );

    const summaryRes = await auth(request(app).get(`/api/items/${itemId}/projection/summary`));
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.requestNewerExpiryFromDate).not.toBeNull();
    expect(summaryRes.body.nextExpiryDate.slice(0, 10)).toBe('2027-12-31');

    const fullRes = await auth(request(app).get(`/api/items/${itemId}/projection?horizonDays=800`));
    expect(fullRes.status).toBe(200);
    expect(fullRes.body.days.length).toBe(801);
    expect(fullRes.body.requestNewerExpiryFromDate).toBe(summaryRes.body.requestNewerExpiryFromDate);
  });

  it('evaluates whether accepting a candidate batch would cause waste', async () => {
    const { accessToken } = await getAuthedAgent();
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${accessToken}`);

    const itemRes = await auth(request(app).post('/api/items').send({ name: 'Medicine B', unit: 'tablet' }));
    const itemId = itemRes.body.id;

    await auth(
      request(app).put(`/api/items/${itemId}/consumption-rate`).send({ ratePerPeriod: 1, periodUnit: 'DAY' }),
    );
    await auth(
      request(app)
        .post(`/api/items/${itemId}/batches`)
        .send({
          receivedDate: '2026-07-15T00:00:00.000Z',
          expiryDate: '2026-07-25T00:00:00.000Z',
          quantityReceived: 8,
        }),
    );

    const res = await auth(
      request(app)
        .post(`/api/items/${itemId}/batches/evaluate-candidate`)
        .send({ quantity: 10, expiryDate: '2026-07-25T00:00:00.000Z' }),
    );
    expect(res.status).toBe(200);
    expect(res.body.wouldCauseWaste).toBe(true);
    expect(res.body.wastedQuantity).toBeGreaterThan(0);
  });
});
