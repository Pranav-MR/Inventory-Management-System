import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

const app = createApp();

const credentials = { email: 'itemstest@example.com', password: 'password123' };

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

describe('items CRUD', () => {
  it('creates, lists, gets, updates and archives an item, scoped to the authenticated user', async () => {
    const { accessToken } = await getAuthedAgent();
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${accessToken}`);

    const createRes = await auth(
      request(app).post('/api/items').send({ name: 'Medicine A', unit: 'tablet' }),
    );
    expect(createRes.status).toBe(201);
    expect(createRes.body.name).toBe('Medicine A');
    const itemId = createRes.body.id;

    const listRes = await auth(request(app).get('/api/items'));
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);

    const getRes = await auth(request(app).get(`/api/items/${itemId}`));
    expect(getRes.status).toBe(200);
    expect(getRes.body.unit).toBe('tablet');

    const updateRes = await auth(
      request(app).patch(`/api/items/${itemId}`).send({ name: 'Medicine A (renamed)' }),
    );
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('Medicine A (renamed)');

    const archiveRes = await auth(request(app).delete(`/api/items/${itemId}`));
    expect(archiveRes.status).toBe(204);

    const listAfterArchive = await auth(request(app).get('/api/items'));
    expect(listAfterArchive.body).toHaveLength(0);
  });

  it('permanently deletes an item and cascades its batches, rate, and recurring supply', async () => {
    const { accessToken } = await getAuthedAgent();
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${accessToken}`);

    const createRes = await auth(
      request(app).post('/api/items').send({ name: 'Medicine A', unit: 'tablet' }),
    );
    const itemId = createRes.body.id;

    await auth(
      request(app).put(`/api/items/${itemId}/consumption-rate`).send({ ratePerPeriod: 10, periodUnit: 'MONTH' }),
    );
    await auth(
      request(app)
        .post(`/api/items/${itemId}/batches`)
        .send({
          receivedDate: '2026-07-01T00:00:00.000Z',
          expiryDate: '2027-12-31T00:00:00.000Z',
          quantityReceived: 16,
        }),
    );

    const deleteRes = await auth(request(app).delete(`/api/items/${itemId}/permanent`));
    expect(deleteRes.status).toBe(204);

    const getAfterDelete = await auth(request(app).get(`/api/items/${itemId}`));
    expect(getAfterDelete.status).toBe(404);

    const listAfterDelete = await auth(request(app).get('/api/items'));
    expect(listAfterDelete.body).toHaveLength(0);

    const batchCount = await prisma.batch.count({ where: { itemId } });
    expect(batchCount).toBe(0);
  });

  it('rejects access to another user\'s item with 404', async () => {
    const { accessToken } = await getAuthedAgent();
    const createRes = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Medicine A', unit: 'tablet' });
    const itemId = createRes.body.id;

    const otherUserRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'otheruser@example.com', password: 'password123' });
    const otherToken = otherUserRes.body.accessToken as string;

    const res = await request(app)
      .get(`/api/items/${itemId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(404);

    await prisma.refreshToken.deleteMany({ where: { user: { email: 'otheruser@example.com' } } });
    await prisma.user.delete({ where: { email: 'otheruser@example.com' } });
  });

  it('sets consumption rate and recurring supply schedule for an item', async () => {
    const { accessToken } = await getAuthedAgent();
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${accessToken}`);

    const createRes = await auth(
      request(app).post('/api/items').send({ name: 'Medicine A', unit: 'tablet' }),
    );
    const itemId = createRes.body.id;

    const rateRes = await auth(
      request(app)
        .put(`/api/items/${itemId}/consumption-rate`)
        .send({ ratePerPeriod: 10, periodUnit: 'MONTH' }),
    );
    expect(rateRes.status).toBe(200);
    expect(rateRes.body.ratePerPeriod).toBe(10);

    const supplyRes = await auth(
      request(app)
        .put(`/api/items/${itemId}/recurring-supply`)
        .send({
          intervalValue: 1,
          intervalUnit: 'MONTH',
          quantityPerDelivery: 16,
          nextExpectedDeliveryDate: '2026-08-01T00:00:00.000Z',
        }),
    );
    expect(supplyRes.status).toBe(200);
    expect(supplyRes.body.quantityPerDelivery).toBe(16);

    const getRes = await auth(request(app).get(`/api/items/${itemId}`));
    expect(getRes.body.consumptionRate.ratePerPeriod).toBe(10);
    expect(getRes.body.recurringSupplySchedule.quantityPerDelivery).toBe(16);

    const deleteSupplyRes = await auth(
      request(app).delete(`/api/items/${itemId}/recurring-supply`),
    );
    expect(deleteSupplyRes.status).toBe(204);

    const getAfterDelete = await auth(request(app).get(`/api/items/${itemId}`));
    expect(getAfterDelete.body.recurringSupplySchedule).toBeNull();
  });

  it('deactivates and reactivates a recurring supply schedule without losing its values', async () => {
    const { accessToken } = await getAuthedAgent();
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${accessToken}`);

    const createRes = await auth(
      request(app).post('/api/items').send({ name: 'Medicine A', unit: 'tablet' }),
    );
    const itemId = createRes.body.id;

    const createSupplyRes = await auth(
      request(app)
        .put(`/api/items/${itemId}/recurring-supply`)
        .send({
          intervalValue: 1,
          intervalUnit: 'MONTH',
          quantityPerDelivery: 16,
          nextExpectedDeliveryDate: '2026-08-01T00:00:00.000Z',
        }),
    );
    expect(createSupplyRes.status).toBe(200);
    expect(createSupplyRes.body.isActive).toBe(true);

    const deactivateRes = await auth(
      request(app)
        .put(`/api/items/${itemId}/recurring-supply`)
        .send({
          intervalValue: 1,
          intervalUnit: 'MONTH',
          quantityPerDelivery: 16,
          nextExpectedDeliveryDate: '2026-08-01T00:00:00.000Z',
          isActive: false,
        }),
    );
    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.body.isActive).toBe(false);
    expect(deactivateRes.body.quantityPerDelivery).toBe(16);

    const getAfterDeactivate = await auth(request(app).get(`/api/items/${itemId}`));
    expect(getAfterDeactivate.body.recurringSupplySchedule.isActive).toBe(false);
    expect(getAfterDeactivate.body.recurringSupplySchedule.quantityPerDelivery).toBe(16);

    const reactivateRes = await auth(
      request(app)
        .put(`/api/items/${itemId}/recurring-supply`)
        .send({
          intervalValue: 1,
          intervalUnit: 'MONTH',
          quantityPerDelivery: 16,
          nextExpectedDeliveryDate: '2026-08-01T00:00:00.000Z',
          isActive: true,
        }),
    );
    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.isActive).toBe(true);
    expect(reactivateRes.body.quantityPerDelivery).toBe(16);
  });
});

describe('batches CRUD', () => {
  it('creates, lists, updates and deletes batches for an item', async () => {
    const { accessToken } = await getAuthedAgent();
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${accessToken}`);

    const createItemRes = await auth(
      request(app).post('/api/items').send({ name: 'Medicine A', unit: 'tablet' }),
    );
    const itemId = createItemRes.body.id;

    const createBatchRes = await auth(
      request(app)
        .post(`/api/items/${itemId}/batches`)
        .send({
          receivedDate: '2026-07-01T00:00:00.000Z',
          expiryDate: '2027-12-31T00:00:00.000Z',
          quantityReceived: 16,
        }),
    );
    expect(createBatchRes.status).toBe(201);
    expect(createBatchRes.body.quantityRemaining).toBe(16);
    const batchId = createBatchRes.body.id;

    const listRes = await auth(request(app).get(`/api/items/${itemId}/batches`));
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);

    const updateRes = await auth(
      request(app).patch(`/api/items/${itemId}/batches/${batchId}`).send({ quantityRemaining: 10 }),
    );
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.quantityRemaining).toBe(10);

    const deleteRes = await auth(request(app).delete(`/api/items/${itemId}/batches/${batchId}`));
    expect(deleteRes.status).toBe(204);

    const listAfterDelete = await auth(request(app).get(`/api/items/${itemId}/batches`));
    expect(listAfterDelete.body).toHaveLength(0);
  });

  it('edits a batch\'s core details and preserves already-consumed quantity when correcting quantityReceived', async () => {
    const { accessToken } = await getAuthedAgent();
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${accessToken}`);

    const createItemRes = await auth(
      request(app).post('/api/items').send({ name: 'Medicine A', unit: 'tablet' }),
    );
    const itemId = createItemRes.body.id;

    const createBatchRes = await auth(
      request(app)
        .post(`/api/items/${itemId}/batches`)
        .send({
          receivedDate: '2026-07-01T00:00:00.000Z',
          expiryDate: '2027-12-31T00:00:00.000Z',
          quantityReceived: 16,
        }),
    );
    const batchId = createBatchRes.body.id;

    // Simulate 6 units already consumed (16 -> 10 remaining).
    const consumeRes = await auth(
      request(app).patch(`/api/items/${itemId}/batches/${batchId}`).send({ quantityRemaining: 10 }),
    );
    expect(consumeRes.status).toBe(200);

    // Now correct a data-entry mistake: label, dates, and the originally-received
    // quantity (16 -> 20). The 6 units already consumed should carry over, not reset.
    const editRes = await auth(
      request(app)
        .patch(`/api/items/${itemId}/batches/${batchId}`)
        .send({
          batchLabel: 'July batch (corrected)',
          receivedDate: '2026-07-02T00:00:00.000Z',
          expiryDate: '2027-11-30T00:00:00.000Z',
          quantityReceived: 20,
        }),
    );
    expect(editRes.status).toBe(200);
    expect(editRes.body.batchLabel).toBe('July batch (corrected)');
    expect(editRes.body.receivedDate.slice(0, 10)).toBe('2026-07-02');
    expect(editRes.body.expiryDate.slice(0, 10)).toBe('2027-11-30');
    expect(editRes.body.quantityReceived).toBe(20);
    expect(editRes.body.quantityRemaining).toBe(14);
  });
});
