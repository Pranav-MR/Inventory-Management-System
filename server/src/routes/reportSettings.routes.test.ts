import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

const app = createApp();
const credentials = { email: 'reportsettingstest@example.com', password: 'password123' };

async function cleanUp() {
  const user = await prisma.user.findUnique({ where: { email: credentials.email } });
  if (user) {
    await prisma.emailReportSettings.deleteMany({ where: { userId: user.id } });
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
}

beforeEach(cleanUp);
afterAll(async () => {
  await cleanUp();
  await prisma.$disconnect();
});

async function signIn() {
  const signupRes = await request(app).post('/api/auth/signup').send(credentials);
  const accessToken = signupRes.body.accessToken as string;
  return (req: request.Test) => req.set('Authorization', `Bearer ${accessToken}`);
}

describe('report settings', () => {
  it('returns sensible defaults before anything has been saved', async () => {
    const auth = await signIn();
    const res = await auth(request(app).get('/api/report-settings'));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ isEnabled: false, recipientEmails: [], frequency: 'WEEKLY', lastSentAt: null });
  });

  it('saves valid settings with multiple recipients and reflects them on GET', async () => {
    const auth = await signIn();
    const saveRes = await auth(
      request(app)
        .put('/api/report-settings')
        .send({
          isEnabled: true,
          recipientEmails: ['owner@example.com', 'manager@example.com'],
          frequency: 'MONTHLY',
        }),
    );
    expect(saveRes.status).toBe(200);
    expect(saveRes.body).toMatchObject({
      isEnabled: true,
      recipientEmails: ['owner@example.com', 'manager@example.com'],
      frequency: 'MONTHLY',
    });

    const getRes = await auth(request(app).get('/api/report-settings'));
    expect(getRes.body.recipientEmails).toEqual(['owner@example.com', 'manager@example.com']);
  });

  it('rejects an invalid email address anywhere in the list', async () => {
    const auth = await signIn();
    const res = await auth(
      request(app)
        .put('/api/report-settings')
        .send({ isEnabled: true, recipientEmails: ['owner@example.com', 'not-an-email'], frequency: 'WEEKLY' }),
    );
    expect(res.status).toBe(400);
  });

  it('rejects an empty recipient list', async () => {
    const auth = await signIn();
    const res = await auth(
      request(app).put('/api/report-settings').send({ isEnabled: true, recipientEmails: [], frequency: 'WEEKLY' }),
    );
    expect(res.status).toBe(400);
  });

  it('rejects duplicate email addresses (case-insensitive)', async () => {
    const auth = await signIn();
    const res = await auth(
      request(app)
        .put('/api/report-settings')
        .send({
          isEnabled: true,
          recipientEmails: ['owner@example.com', 'Owner@Example.com'],
          frequency: 'WEEKLY',
        }),
    );
    expect(res.status).toBe(400);
  });

  it('sends a test email to every recipient without touching saved settings or lastSentAt', async () => {
    const auth = await signIn();
    await auth(
      request(app)
        .put('/api/report-settings')
        .send({ isEnabled: true, recipientEmails: ['saved@example.com'], frequency: 'WEEKLY' }),
    );

    const testRes = await auth(
      request(app)
        .post('/api/report-settings/test-email')
        .send({ recipientEmails: ['someone-else@example.com', 'another@example.com'] }),
    );
    expect(testRes.status).toBe(200);
    expect(testRes.body).toEqual({ sent: 2, failed: 0, failedAddresses: [] });

    const getRes = await auth(request(app).get('/api/report-settings'));
    // Test email used different addresses but must not overwrite the saved recipient list.
    expect(getRes.body.recipientEmails).toEqual(['saved@example.com']);
    expect(getRes.body.lastSentAt).toBeNull();
  }, 30000);

  it('rejects a test-email request with an invalid address', async () => {
    const auth = await signIn();
    const res = await auth(
      request(app).post('/api/report-settings/test-email').send({ recipientEmails: ['nope'] }),
    );
    expect(res.status).toBe(400);
  });

  it('rejects a test-email request with duplicate addresses', async () => {
    const auth = await signIn();
    const res = await auth(
      request(app)
        .post('/api/report-settings/test-email')
        .send({ recipientEmails: ['a@example.com', 'a@example.com'] }),
    );
    expect(res.status).toBe(400);
  });
});
