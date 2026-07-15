import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { dispatchNotification } from '../services/notification.service.js';

const app = createApp();

const credentials = { email: 'notificationtest@example.com', password: 'password123' };

async function cleanUp() {
  const user = await prisma.user.findUnique({ where: { email: credentials.email } });
  if (user) {
    await prisma.notificationLog.deleteMany({ where: { userId: user.id } });
    await prisma.notificationPreference.deleteMany({ where: { userId: user.id } });
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
}

async function getAuthedAgent() {
  const signupRes = await request(app).post('/api/auth/signup').send(credentials);
  return { accessToken: signupRes.body.accessToken as string, userId: signupRes.body.user.id as string };
}

beforeEach(cleanUp);
afterAll(async () => {
  await cleanUp();
  await prisma.$disconnect();
});

describe('notification preferences', () => {
  it('upserts and lists preferences for the authenticated user', async () => {
    const { accessToken } = await getAuthedAgent();
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${accessToken}`);

    const upsertRes = await auth(
      request(app)
        .put('/api/notification-preferences')
        .send([{ eventType: 'LOW_STOCK', channel: 'EMAIL', isEnabled: true, leadTimeDays: 5 }]),
    );
    expect(upsertRes.status).toBe(200);
    expect(upsertRes.body).toHaveLength(1);

    const listRes = await auth(request(app).get('/api/notification-preferences'));
    expect(listRes.status).toBe(200);
    expect(listRes.body[0]).toMatchObject({ eventType: 'LOW_STOCK', channel: 'EMAIL', leadTimeDays: 5 });

    const updateRes = await auth(
      request(app)
        .put('/api/notification-preferences')
        .send([{ eventType: 'LOW_STOCK', channel: 'EMAIL', isEnabled: false, leadTimeDays: 3 }]),
    );
    expect(updateRes.body[0].isEnabled).toBe(false);
    expect(updateRes.body[0].leadTimeDays).toBe(3);
  });
});

describe('notification dispatch + logs', () => {
  it('dispatches a notification, logs it, and is idempotent for the same day', async () => {
    const { accessToken, userId } = await getAuthedAgent();
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${accessToken}`);

    await dispatchNotification({
      userId,
      itemId: null,
      eventType: 'LOW_STOCK',
      context: { itemName: 'Medicine A', unit: 'tablet', daysOfStockRemaining: 3 },
    });

    const logsRes = await auth(request(app).get('/api/notification-logs'));
    expect(logsRes.status).toBe(200);
    expect(logsRes.body).toHaveLength(1);
    expect(logsRes.body[0]).toMatchObject({ eventType: 'LOW_STOCK', channel: 'EMAIL', status: 'SENT' });

    // Re-dispatching the same event/item/channel/day must not create a second log row.
    await dispatchNotification({
      userId,
      itemId: null,
      eventType: 'LOW_STOCK',
      context: { itemName: 'Medicine A', unit: 'tablet', daysOfStockRemaining: 2 },
    });

    const logsAfterRes = await auth(request(app).get('/api/notification-logs'));
    expect(logsAfterRes.body).toHaveLength(1);
  });
});
