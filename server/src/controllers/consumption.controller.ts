import type { Request, Response } from 'express';
import { z } from 'zod';
import type { ConsumptionEntry } from '@prisma/client';
import * as consumptionService from '../services/consumption.service.js';
import { decimalToNumber } from '../lib/decimal.js';

const createEntrySchema = z.object({
  date: z.coerce.date(),
  quantity: z.number().positive(),
});

const updateEntrySchema = z.object({
  date: z.coerce.date().optional(),
  quantity: z.number().positive().optional(),
});

function toEntryDto(entry: ConsumptionEntry) {
  return {
    id: entry.id,
    date: entry.date,
    quantity: decimalToNumber(entry.quantity),
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

export async function list(req: Request, res: Response) {
  const entries = await consumptionService.listConsumptionEntries(req.userId!, req.params.itemId);
  res.json(entries.map(toEntryDto));
}

export async function create(req: Request, res: Response) {
  const input = createEntrySchema.parse(req.body);
  const entry = await consumptionService.createConsumptionEntry(req.userId!, req.params.itemId, input);
  res.status(201).json(toEntryDto(entry));
}

export async function update(req: Request, res: Response) {
  const input = updateEntrySchema.parse(req.body);
  const entry = await consumptionService.updateConsumptionEntry(
    req.userId!,
    req.params.itemId,
    req.params.entryId,
    input,
  );
  res.json(toEntryDto(entry));
}

export async function remove(req: Request, res: Response) {
  await consumptionService.deleteConsumptionEntry(req.userId!, req.params.itemId, req.params.entryId);
  res.status(204).send();
}
