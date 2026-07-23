import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

const app = createApp();

async function cleanUsers() {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { contains: 'authtest' } } });
}

beforeEach(cleanUsers);
afterAll(async () => {
  await cleanUsers();
  await prisma.$disconnect();
});

const credentials = { email: 'authtest@example.com', password: 'password123' };

describe('auth flow', () => {
  it('signs up, rejects duplicate email, logs in, and exposes /me', async () => {
    const signupRes = await request(app).post('/api/auth/signup').send(credentials);
    expect(signupRes.status).toBe(201);
    expect(signupRes.body.user.email).toBe(credentials.email);
    expect(signupRes.body.accessToken).toBeTruthy();

    const dupRes = await request(app).post('/api/auth/signup').send(credentials);
    expect(dupRes.status).toBe(409);

    const loginRes = await request(app).post('/api/auth/login').send(credentials);
    expect(loginRes.status).toBe(200);
    const accessToken = loginRes.body.accessToken as string;

    const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe(credentials.email);

    const unauthedRes = await request(app).get('/api/auth/me');
    expect(unauthedRes.status).toBe(401);
  });

  it('rejects login with wrong password', async () => {
    await request(app).post('/api/auth/signup').send(credentials);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('rotates refresh token and rejects it after logout', async () => {
    const loginRes = await request(app).post('/api/auth/signup').send(credentials);
    const cookie = loginRes.headers['set-cookie'];
    expect(cookie).toBeTruthy();

    const refreshRes = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBeTruthy();
    const rotatedCookie = refreshRes.headers['set-cookie'];

    const logoutRes = await request(app).post('/api/auth/logout').set('Cookie', rotatedCookie);
    expect(logoutRes.status).toBe(204);

    const reuseRes = await request(app).post('/api/auth/refresh').set('Cookie', rotatedCookie);
    expect(reuseRes.status).toBe(401);
  });

  it('updates the display name without touching the password', async () => {
    const signupRes = await request(app).post('/api/auth/signup').send(credentials);
    const accessToken = signupRes.body.accessToken as string;

    const updateRes = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'New Name' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('New Name');

    const loginRes = await request(app).post('/api/auth/login').send(credentials);
    expect(loginRes.status).toBe(200);
  });

  it('changes the password only when the current password is correct', async () => {
    const signupRes = await request(app).post('/api/auth/signup').send(credentials);
    const accessToken = signupRes.body.accessToken as string;

    const wrongRes = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'not-the-password', newPassword: 'newpassword123' });
    expect(wrongRes.status).toBe(401);

    const okRes = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: credentials.password, newPassword: 'newpassword123' });
    expect(okRes.status).toBe(200);

    const oldLoginRes = await request(app).post('/api/auth/login').send(credentials);
    expect(oldLoginRes.status).toBe(401);

    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'newpassword123' });
    expect(newLoginRes.status).toBe(200);
  });

  it('rejects a new password without the current password', async () => {
    const signupRes = await request(app).post('/api/auth/signup').send(credentials);
    const accessToken = signupRes.body.accessToken as string;

    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ newPassword: 'newpassword123' });
    expect(res.status).toBe(400);
  });
});
