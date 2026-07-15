import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

const app = createApp();
const credentials = { email: 'dashboardtest@example.com', password: 'password123' };

async function cleanUp() {
  const user = await prisma.user.findUnique({ where: { email: credentials.email } });
  if (user) {
    await prisma.batch.deleteMany({ where: { item: { userId: user.id } } });
    await prisma.consumptionRate.deleteMany({ where: { item: { userId: user.id } } });
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
