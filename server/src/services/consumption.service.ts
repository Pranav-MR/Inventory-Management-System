import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../lib/errors.js';
import { assertItemOwnership } from './items.service.js';
import { logActivity } from './activity.service.js';
import type { ConsumptionAllocation, ConsumptionEntry, Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

/**
 * FIFO-deducts `quantity` across the item's active batches, soonest-expiry
 * first, capping at whatever is actually available (never goes negative —
 * a logged entry that exceeds tracked stock is still recorded, it just
 * can't over-deduct). Returns the per-batch breakdown for allocation rows.
 */
async function allocateConsumption(
  tx: Tx,
  itemId: string,
  quantity: number,
): Promise<Array<{ batchId: string; quantity: number }>> {
  const activeBatches = await tx.batch.findMany({
    where: { itemId, status: 'ACTIVE', quantityRemaining: { gt: 0 } },
    orderBy: { expiryDate: 'asc' },
  });

  let remaining = quantity;
  const allocations: Array<{ batchId: string; quantity: number }> = [];

  for (const batch of activeBatches) {
    if (remaining <= 0) break;
    const available = Number(batch.quantityRemaining);
    const take = Math.min(available, remaining);
    if (take <= 0) continue;

    allocations.push({ batchId: batch.id, quantity: take });
    remaining -= take;

    const newRemaining = available - take;
    await tx.batch.update({
      where: { id: batch.id },
      data: {
        quantityRemaining: newRemaining,
        quantityAsOfDate: new Date(),
        status: newRemaining <= 0 ? 'DEPLETED' : 'ACTIVE',
      },
    });
  }

  return allocations;
}

/** Undoes a set of allocations, restoring quantity to whichever batches still exist. */
async function reverseAllocations(tx: Tx, allocations: ConsumptionAllocation[]): Promise<void> {
  for (const allocation of allocations) {
    const batch = await tx.batch.findUnique({ where: { id: allocation.batchId } });
    if (!batch) continue; // batch was hard-deleted since this entry was logged

    const restored = Math.min(Number(batch.quantityReceived), Number(batch.quantityRemaining) + Number(allocation.quantity));
    await tx.batch.update({
      where: { id: batch.id },
      data: {
        quantityRemaining: restored,
        quantityAsOfDate: new Date(),
        status: batch.status === 'DEPLETED' && restored > 0 ? 'ACTIVE' : batch.status,
      },
    });
  }
}

export async function listConsumptionEntries(userId: string, itemId: string) {
  await assertItemOwnership(userId, itemId);
  return prisma.consumptionEntry.findMany({ where: { itemId }, orderBy: { date: 'desc' } });
}

export async function createConsumptionEntry(
  userId: string,
  itemId: string,
  input: { date: Date; quantity: number },
): Promise<ConsumptionEntry> {
  const item = await assertItemOwnership(userId, itemId);

  const entry = await prisma.$transaction(async (tx) => {
    const created = await tx.consumptionEntry.create({
      data: { itemId, date: input.date, quantity: input.quantity },
    });
    const allocations = await allocateConsumption(tx, itemId, input.quantity);
    if (allocations.length > 0) {
      await tx.consumptionAllocation.createMany({
        data: allocations.map((a) => ({ consumptionEntryId: created.id, batchId: a.batchId, quantity: a.quantity })),
      });
    }
    return created;
  });

  await logActivity({
    userId,
    itemId,
    itemName: item.name,
    type: 'CONSUMPTION_RECORDED',
    message: `Logged consumption of ${input.quantity} ${item.unit} for "${item.name}"`,
  });

  return entry;
}

async function getOwnedEntry(itemId: string, entryId: string) {
  const existing = await prisma.consumptionEntry.findUnique({
    where: { id: entryId },
    include: { allocations: true },
  });
  if (!existing || existing.itemId !== itemId) {
    throw new NotFoundError('Consumption entry not found');
  }
  return existing;
}

export async function updateConsumptionEntry(
  userId: string,
  itemId: string,
  entryId: string,
  input: { date?: Date; quantity?: number },
): Promise<ConsumptionEntry> {
  const item = await assertItemOwnership(userId, itemId);
  const existing = await getOwnedEntry(itemId, entryId);
  const newQuantity = input.quantity ?? Number(existing.quantity);

  const entry = await prisma.$transaction(async (tx) => {
    await reverseAllocations(tx, existing.allocations);
    await tx.consumptionAllocation.deleteMany({ where: { consumptionEntryId: entryId } });

    const allocations = await allocateConsumption(tx, itemId, newQuantity);
    if (allocations.length > 0) {
      await tx.consumptionAllocation.createMany({
        data: allocations.map((a) => ({ consumptionEntryId: entryId, batchId: a.batchId, quantity: a.quantity })),
      });
    }

    return tx.consumptionEntry.update({
      where: { id: entryId },
      data: {
        ...(input.date != null ? { date: input.date } : {}),
        quantity: newQuantity,
      },
    });
  });

  await logActivity({
    userId,
    itemId,
    itemName: item.name,
    type: 'CONSUMPTION_RECORDED',
    message: `Edited a consumption log entry for "${item.name}"`,
  });

  return entry;
}

export async function deleteConsumptionEntry(userId: string, itemId: string, entryId: string): Promise<void> {
  const item = await assertItemOwnership(userId, itemId);
  const existing = await getOwnedEntry(itemId, entryId);

  await prisma.$transaction(async (tx) => {
    await reverseAllocations(tx, existing.allocations);
    await tx.consumptionEntry.delete({ where: { id: entryId } });
  });

  await logActivity({
    userId,
    itemId,
    itemName: item.name,
    type: 'CONSUMPTION_RECORDED',
    message: `Deleted a consumption log entry for "${item.name}"`,
  });
}
