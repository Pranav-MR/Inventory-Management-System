import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../lib/errors.js';
import { logActivity } from './activity.service.js';
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
  const item = await prisma.item.create({
    data: {
      userId,
      name: input.name,
      unit: input.unit,
      category: input.category,
      lowStockThreshold: input.lowStockThreshold,
    },
    include: { consumptionRate: true, recurringSupplySchedule: true, batches: true },
  });
  await logActivity({
    userId,
    itemId: item.id,
    itemName: item.name,
    type: 'ITEM_ADDED',
    message: `Added item "${item.name}"`,
  });
  return item;
}

export async function updateItem(
  userId: string,
  itemId: string,
  input: { name?: string; unit?: string; category?: string | null; lowStockThreshold?: number | null },
) {
  await assertItemOwnership(userId, itemId);
  const item = await prisma.item.update({
    where: { id: itemId },
    data: input,
    include: { consumptionRate: true, recurringSupplySchedule: true, batches: true },
  });
  await logActivity({
    userId,
    itemId: item.id,
    itemName: item.name,
    type: 'ITEM_EDITED',
    message: `Edited item "${item.name}"`,
  });
  return item;
}

export async function archiveItem(userId: string, itemId: string) {
  const existing = await assertItemOwnership(userId, itemId);
  await prisma.item.update({ where: { id: itemId }, data: { isArchived: true } });
  await logActivity({
    userId,
    itemId,
    itemName: existing.name,
    type: 'ITEM_ARCHIVED',
    message: `Archived item "${existing.name}"`,
  });
}

export async function deleteItem(userId: string, itemId: string) {
  const existing = await assertItemOwnership(userId, itemId);
  await prisma.item.delete({ where: { id: itemId } });
  await logActivity({
    userId,
    itemId: null,
    itemName: existing.name,
    type: 'ITEM_DELETED',
    message: `Deleted item "${existing.name}"`,
  });
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
    isActive?: boolean;
  },
) {
  await assertItemOwnership(userId, itemId);
  const { isActive = true, ...rest } = input;
  return prisma.recurringSupplySchedule.upsert({
    where: { itemId },
    create: { itemId, ...rest, isActive },
    update: { ...rest, isActive },
  });
}

export async function deleteRecurringSupply(userId: string, itemId: string) {
  await assertItemOwnership(userId, itemId);
  await prisma.recurringSupplySchedule.deleteMany({ where: { itemId } });
}
