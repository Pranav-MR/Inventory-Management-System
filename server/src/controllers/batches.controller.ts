import type { Request, Response } from 'express';
import { z } from 'zod';
import type { Batch } from '@prisma/client';
import * as batchesService from '../services/batches.service.js';
import * as projectionService from '../services/projection.service.js';
import { decimalToNumber } from '../lib/decimal.js';

const createBatchSchema = z.object({
  batchLabel: z.string().min(1).optional(),
  receivedDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
  quantityReceived: z.number().positive(),
});

const evaluateCandidateSchema = z.object({
  quantity: z.number().positive(),
  expiryDate: z.coerce.date(),
});

const updateBatchSchema = z.object({
  batchLabel: z.string().min(1).nullable().optional(),
  receivedDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  quantityReceived: z.number().positive().optional(),
  quantityRemaining: z.number().min(0).optional(),
  status: z.enum(['ACTIVE', 'DEPLETED', 'EXPIRED', 'DISCARDED']).optional(),
});

function toBatchDto(batch: Batch) {
  return {
    id: batch.id,
    batchLabel: batch.batchLabel,
    receivedDate: batch.receivedDate,
    expiryDate: batch.expiryDate,
    quantityReceived: decimalToNumber(batch.quantityReceived),
    quantityRemaining: decimalToNumber(batch.quantityRemaining),
    quantityAsOfDate: batch.quantityAsOfDate,
    status: batch.status,
  };
}

export async function list(req: Request, res: Response) {
  const batches = await batchesService.listBatches(req.userId!, req.params.itemId);
  res.json(batches.map(toBatchDto));
}

export async function create(req: Request, res: Response) {
  const input = createBatchSchema.parse(req.body);
  const batch = await batchesService.createBatch(req.userId!, req.params.itemId, input);
  res.status(201).json(toBatchDto(batch));
}

export async function update(req: Request, res: Response) {
  const input = updateBatchSchema.parse(req.body);
  const batch = await batchesService.updateBatch(
    req.userId!,
    req.params.itemId,
    req.params.batchId,
    input,
  );
  res.json(toBatchDto(batch));
}

export async function remove(req: Request, res: Response) {
  await batchesService.deleteBatch(req.userId!, req.params.itemId, req.params.batchId);
  res.status(204).send();
}

export async function evaluateCandidate(req: Request, res: Response) {
  const input = evaluateCandidateSchema.parse(req.body);
  const result = await projectionService.evaluateCandidate(req.userId!, req.params.itemId, input);
  res.json(result);
}
