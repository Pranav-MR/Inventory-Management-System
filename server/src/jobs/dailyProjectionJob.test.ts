import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../lib/prisma.js';
import { runDailyProjectionJob } from './dailyProjectionJob.js';

const email = 'dailyjobtest@example.com';

async function cleanUp() {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
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

function daysAgo(n: number): Date {
  const today = new Date();
  return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - n));
}

describe('runDailyProjectionJob', () => {
  it('ages a batch forward from its last snapshot to today', async () => {
    const user = await prisma.user.create({ data: { email, passwordHash: 'x' } });
    const item = await prisma.item.create({
      data: { userId: user.id, name: 'Medicine A', unit: 'tablet' },
    });
    await prisma.consumptionRate.create({ data: { itemId: item.id, ratePerPeriod: 1, periodUnit: 'DAY' } });

    const receivedDate = daysAgo(5);
    const batch = await prisma.batch.create({
      data: {
        itemId: item.id,
        receivedDate,
        expiryDate: new Date(Date.now() + 365 * 86_400_000),
        quantityReceived: 10,
        quantityRemaining: 10,
        quantityAsOfDate: receivedDate,
      },
    });

    await runDailyProjectionJob();

    const updatedBatch = await prisma.batch.findUniqueOrThrow({ where: { id: batch.id } });
    // 5 days at 1/day consumed -> 5 remaining. quantityAsOfDate should be bumped to today.
    expect(Number(updatedBatch.quantityRemaining)).toBeCloseTo(5, 6);
    expect(updatedBatch.quantityAsOfDate.toISOString().slice(0, 10)).toBe(new Date().toISOString().slice(0, 10));
    expect(updatedBatch.status).toBe('ACTIVE');
  });

  it('is idempotent: running twice the same day does not double-consume a batch', async () => {
    const user = await prisma.user.create({ data: { email, passwordHash: 'x' } });
    const item = await prisma.item.create({ data: { userId: user.id, name: 'Medicine A', unit: 'tablet' } });
    await prisma.consumptionRate.create({ data: { itemId: item.id, ratePerPeriod: 1, periodUnit: 'DAY' } });
    const receivedDate = daysAgo(1);
    const batch = await prisma.batch.create({
      data: {
        itemId: item.id,
        receivedDate,
        expiryDate: new Date(Date.now() + 365 * 86_400_000),
        quantityReceived: 3,
        quantityRemaining: 3,
        quantityAsOfDate: receivedDate,
      },
    });

    await runDailyProjectionJob();
    const afterFirstRun = await prisma.batch.findUniqueOrThrow({ where: { id: batch.id } });

    await runDailyProjectionJob();
    const afterSecondRun = await prisma.batch.findUniqueOrThrow({ where: { id: batch.id } });

    expect(Number(afterSecondRun.quantityRemaining)).toBe(Number(afterFirstRun.quantityRemaining));
  });

  it('does nothing for an item with no consumption rate set', async () => {
    const user = await prisma.user.create({ data: { email, passwordHash: 'x' } });
    const item = await prisma.item.create({ data: { userId: user.id, name: 'No Rate Item', unit: 'unit' } });
    const receivedDate = daysAgo(5);
    const batch = await prisma.batch.create({
      data: {
        itemId: item.id,
        receivedDate,
        expiryDate: new Date(Date.now() + 365 * 86_400_000),
        quantityReceived: 10,
        quantityRemaining: 10,
        quantityAsOfDate: receivedDate,
      },
    });

    await expect(runDailyProjectionJob()).resolves.not.toThrow();

    const unchangedBatch = await prisma.batch.findUniqueOrThrow({ where: { id: batch.id } });
    expect(Number(unchangedBatch.quantityRemaining)).toBe(10);
  });
});
