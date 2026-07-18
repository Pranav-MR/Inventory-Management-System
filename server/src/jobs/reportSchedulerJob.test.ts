import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../lib/prisma.js';
import { runScheduledReportsJob } from './reportSchedulerJob.js';

const email = 'reportschedulertest@example.com';

async function cleanUp() {
  const user = await prisma.user.findUnique({ where: { email } });
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

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

describe('runScheduledReportsJob', () => {
  it('sends a report for a never-sent enabled weekly setting, then does not resend the same day', async () => {
    const user = await prisma.user.create({ data: { email, passwordHash: 'x' } });
    const settings = await prisma.emailReportSettings.create({
      data: { userId: user.id, isEnabled: true, recipientEmails: ['owner@example.com'], frequency: 'WEEKLY', lastSentAt: null },
    });

    await runScheduledReportsJob();
    const afterFirst = await prisma.emailReportSettings.findUniqueOrThrow({ where: { id: settings.id } });
    expect(afterFirst.lastSentAt).not.toBeNull();

    await runScheduledReportsJob();
    const afterSecond = await prisma.emailReportSettings.findUniqueOrThrow({ where: { id: settings.id } });
    expect(afterSecond.lastSentAt?.getTime()).toBe(afterFirst.lastSentAt?.getTime());
  }, 30000);

  it('resends a weekly report once 7+ days have passed since the last send', async () => {
    const user = await prisma.user.create({ data: { email, passwordHash: 'x' } });
    const settings = await prisma.emailReportSettings.create({
      data: { userId: user.id, isEnabled: true, recipientEmails: ['owner@example.com'], frequency: 'WEEKLY', lastSentAt: daysAgo(8) },
    });

    await runScheduledReportsJob();
    const after = await prisma.emailReportSettings.findUniqueOrThrow({ where: { id: settings.id } });
    expect(after.lastSentAt!.getTime()).toBeGreaterThan(daysAgo(1).getTime());
  }, 30000);

  it('does not send a monthly report before a full month has elapsed', async () => {
    const user = await prisma.user.create({ data: { email, passwordHash: 'x' } });
    const settings = await prisma.emailReportSettings.create({
      data: { userId: user.id, isEnabled: true, recipientEmails: ['owner@example.com'], frequency: 'MONTHLY', lastSentAt: daysAgo(10) },
    });

    await runScheduledReportsJob();
    const after = await prisma.emailReportSettings.findUniqueOrThrow({ where: { id: settings.id } });
    expect(after.lastSentAt!.getTime()).toBe(settings.lastSentAt!.getTime());
  });

  it('sends to every configured recipient', async () => {
    const user = await prisma.user.create({ data: { email, passwordHash: 'x' } });
    const settings = await prisma.emailReportSettings.create({
      data: {
        userId: user.id,
        isEnabled: true,
        recipientEmails: ['owner@example.com', 'manager@example.com', 'accountant@example.com'],
        frequency: 'WEEKLY',
        lastSentAt: null,
      },
    });

    await runScheduledReportsJob();
    const after = await prisma.emailReportSettings.findUniqueOrThrow({ where: { id: settings.id } });
    expect(after.lastSentAt).not.toBeNull();
  }, 30000);

  it('skips disabled settings entirely', async () => {
    const user = await prisma.user.create({ data: { email, passwordHash: 'x' } });
    const settings = await prisma.emailReportSettings.create({
      data: { userId: user.id, isEnabled: false, recipientEmails: ['owner@example.com'], frequency: 'WEEKLY', lastSentAt: null },
    });

    await runScheduledReportsJob();
    const after = await prisma.emailReportSettings.findUniqueOrThrow({ where: { id: settings.id } });
    expect(after.lastSentAt).toBeNull();
  });
});
