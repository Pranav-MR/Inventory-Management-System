import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../lib/errors.js';
import { assertItemOwnership } from './items.service.js';
import type { BatchStatus } from '@prisma/client';

export async function listBatches(userId: string, itemId: string) {
  await assertItemOwnership(userId, itemId);
  return prisma.batch.findMany({ where: { itemId }, orderBy: { expiryDate: 'asc' } });
}

export async function createBatch(
  userId: string,
  itemId: string,
  input: {
    batchLabel?: string;
    receivedDate: Date;
    expiryDate: Date;
    quantityReceived: number;
  },
) {
  await assertItemOwnership(userId, itemId);
  return prisma.batch.create({
    data: {
      itemId,
      batchLabel: input.batchLabel,
      receivedDate: input.receivedDate,
      expiryDate: input.expiryDate,
      quantityReceived: input.quantityReceived,
      quantityRemaining: input.quantityReceived,
      quantityAsOfDate: input.receivedDate,
    },
  });
}

async function assertBatchOwnership(userId: string, itemId: string, batchId: string) {
  await assertItemOwnership(userId, itemId);
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch || batch.itemId !== itemId) {
    throw new NotFoundError('Batch not found');
  }
  return batch;
}

export async function updateBatch(
  userId: string,
  itemId: string,
  batchId: string,
  input: {
    batchLabel?: string | null;
    receivedDate?: Date;
    expiryDate?: Date;
    quantityReceived?: number;
    quantityRemaining?: number;
    status?: BatchStatus;
  },
) {
  const existing = await assertBatchOwnership(userId, itemId, batchId);

  // Editing the originally-received quantity is a data correction, not a
  // consumption event — preserve however much has already been consumed
  // rather than resetting remaining stock back up to the new total.
  let { quantityRemaining } = input;
  if (input.quantityReceived != null && quantityRemaining == null) {
    const consumedSoFar = Number(existing.quantityReceived) - Number(existing.quantityRemaining);
    quantityRemaining = Math.max(0, input.quantityReceived - consumedSoFar);
  }

  return prisma.batch.update({
    where: { id: batchId },
    data: {
      ...input,
      ...(quantityRemaining != null ? { quantityRemaining } : {}),
      ...(input.quantityReceived != null || quantityRemaining != null ? { quantityAsOfDate: new Date() } : {}),
    },
  });
}

export async function deleteBatch(userId: string, itemId: string, batchId: string) {
  await assertBatchOwnership(userId, itemId, batchId);
  await prisma.batch.delete({ where: { id: batchId } });
}
