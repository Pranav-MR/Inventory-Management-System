import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../lib/errors.js';
import type { PeriodUnit } from '@prisma/client';

export async function assertItemOwnership(userId: string, itemId: string) {
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== userId) {
    throw new NotFoundError('Item not found');
  }
  return item;
}

export async function listItems(userId: string, options: { includeArchived?: boolean } = {}) {
  return prisma.item.findMany({
    where: { userId, ...(options.includeArchived ? {} : { isArchived: false }) },
    include: { consumptionRate: true, recurringSupplySchedule: true, batches: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getItem(userId: string, itemId: string) {
  await assertItemOwnership(userId, itemId);
  return prisma.item.findUniqueOrThrow({
    where: { id: itemId },
    include: { consumptionRate: true, recurringSupplySchedule: true, batches: true },
  });
}

export async function createItem(
  userId: string,
  input: { name: string; unit: string; category?: string; lowStockThreshold?: number },
) {
  return prisma.item.create({
    data: {
      userId,
      name: input.name,
      unit: input.unit,
      category: input.category,
      lowStockThreshold: input.lowStockThreshold,
    },
    include: { consumptionRate: true, recurringSupplySchedule: true, batches: true },
  });
}

export async function updateItem(
  userId: string,
  itemId: string,
  input: { name?: string; unit?: string; category?: string | null; lowStockThreshold?: number | null },
) {
  await assertItemOwnership(userId, itemId);
  return prisma.item.update({
    where: { id: itemId },
    data: input,
    include: { consumptionRate: true, recurringSupplySchedule: true, batches: true },
  });
}

export async function archiveItem(userId: string, itemId: string) {
  await assertItemOwnership(userId, itemId);
  await prisma.item.update({ where: { id: itemId }, data: { isArchived: true } });
}

export async function upsertConsumptionRate(
  userId: string,
  itemId: string,
  input: { ratePerPeriod: number; periodUnit: PeriodUnit },
) {
  await assertItemOwnership(userId, itemId);
  return prisma.consumptionRate.upsert({
    where: { itemId },
    create: { itemId, ratePerPeriod: input.ratePerPeriod, periodUnit: input.periodUnit },
    update: { ratePerPeriod: input.ratePerPeriod, periodUnit: input.periodUnit },
  });
}

export async function upsertRecurringSupply(
  userId: string,
  itemId: string,
  input: {
    intervalValue: number;
    intervalUnit: PeriodUnit;
    quantityPerDelivery: number;
    nextExpectedDeliveryDate: Date;
    assumedExpiryForFuture?: Date | null;
  },
) {
  await assertItemOwnership(userId, itemId);
  return prisma.recurringSupplySchedule.upsert({
    where: { itemId },
    create: { itemId, ...input, isActive: true },
    update: { ...input, isActive: true },
  });
}

export async function deleteRecurringSupply(userId: string, itemId: string) {
  await assertItemOwnership(userId, itemId);
  await prisma.recurringSupplySchedule.deleteMany({ where: { itemId } });
}
