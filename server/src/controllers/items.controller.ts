import type { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import * as itemsService from '../services/items.service.js';
import { decimalToNumber } from '../lib/decimal.js';

type ItemWithRelations = Prisma.ItemGetPayload<{
  include: { consumptionRate: true; recurringSupplySchedule: true; batches: true };
}>;

const periodUnitSchema = z.enum(['DAY', 'WEEK', 'MONTH', 'YEAR']);

const createItemSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  category: z.string().min(1).optional(),
  lowStockThreshold: z.number().positive().optional(),
});

const updateItemSchema = z.object({
  name: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  category: z.string().min(1).nullable().optional(),
  lowStockThreshold: z.number().positive().nullable().optional(),
});

const consumptionRateSchema = z.object({
  ratePerPeriod: z.number().positive(),
  periodUnit: periodUnitSchema,
});

const recurringSupplySchema = z.object({
  intervalValue: z.number().int().positive(),
  intervalUnit: periodUnitSchema,
  quantityPerDelivery: z.number().positive(),
  nextExpectedDeliveryDate: z.coerce.date(),
  assumedExpiryForFuture: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional().default(true),
});

function toItemDto(item: ItemWithRelations) {
  return {
    id: item.id,
    name: item.name,
    unit: item.unit,
    category: item.category,
    lowStockThreshold: decimalToNumber(item.lowStockThreshold),
    isArchived: item.isArchived,
    createdAt: item.createdAt,
    consumptionRate: item.consumptionRate
      ? {
          ratePerPeriod: decimalToNumber(item.consumptionRate.ratePerPeriod),
          periodUnit: item.consumptionRate.periodUnit,
        }
      : null,
    recurringSupplySchedule: item.recurringSupplySchedule
      ? {
          intervalValue: item.recurringSupplySchedule.intervalValue,
          intervalUnit: item.recurringSupplySchedule.intervalUnit,
          quantityPerDelivery: decimalToNumber(item.recurringSupplySchedule.quantityPerDelivery),
          nextExpectedDeliveryDate: item.recurringSupplySchedule.nextExpectedDeliveryDate,
          assumedExpiryForFuture: item.recurringSupplySchedule.assumedExpiryForFuture,
          isActive: item.recurringSupplySchedule.isActive,
        }
      : null,
    batches: item.batches?.map((b) => ({
      id: b.id,
      batchLabel: b.batchLabel,
      receivedDate: b.receivedDate,
      expiryDate: b.expiryDate,
      quantityReceived: decimalToNumber(b.quantityReceived),
      quantityRemaining: decimalToNumber(b.quantityRemaining),
      quantityAsOfDate: b.quantityAsOfDate,
      status: b.status,
    })),
  };
}

export async function list(req: Request, res: Response) {
  const includeArchived = req.query.includeArchived === 'true';
  const items = await itemsService.listItems(req.userId!, { includeArchived });
  res.json(items.map(toItemDto));
}

export async function create(req: Request, res: Response) {
  const input = createItemSchema.parse(req.body);
  const item = await itemsService.createItem(req.userId!, input);
  res.status(201).json(toItemDto(item));
}

export async function get(req: Request, res: Response) {
  const item = await itemsService.getItem(req.userId!, req.params.itemId);
  res.json(toItemDto(item));
}

export async function update(req: Request, res: Response) {
  const input = updateItemSchema.parse(req.body);
  const item = await itemsService.updateItem(req.userId!, req.params.itemId, input);
  res.json(toItemDto(item));
}

export async function archive(req: Request, res: Response) {
  await itemsService.archiveItem(req.userId!, req.params.itemId);
  res.status(204).send();
}

export async function remove(req: Request, res: Response) {
  await itemsService.deleteItem(req.userId!, req.params.itemId);
  res.status(204).send();
}

export async function putConsumptionRate(req: Request, res: Response) {
  const input = consumptionRateSchema.parse(req.body);
  const rate = await itemsService.upsertConsumptionRate(req.userId!, req.params.itemId, input);
  res.json({ ratePerPeriod: decimalToNumber(rate.ratePerPeriod), periodUnit: rate.periodUnit });
}

export async function putRecurringSupply(req: Request, res: Response) {
  const input = recurringSupplySchema.parse(req.body);
  const schedule = await itemsService.upsertRecurringSupply(req.userId!, req.params.itemId, input);
  res.json({
    intervalValue: schedule.intervalValue,
    intervalUnit: schedule.intervalUnit,
    quantityPerDelivery: decimalToNumber(schedule.quantityPerDelivery),
    nextExpectedDeliveryDate: schedule.nextExpectedDeliveryDate,
    assumedExpiryForFuture: schedule.assumedExpiryForFuture,
    isActive: schedule.isActive,
  });
}

export async function deleteRecurringSupply(req: Request, res: Response) {
  await itemsService.deleteRecurringSupply(req.userId!, req.params.itemId);
  res.status(204).send();
}
