import { prisma } from '../lib/prisma.js';
import { simulate } from '../engine/simulate.js';
import { evaluateCandidateBatch } from '../engine/evaluateCandidateBatch.js';
import { diffInDays, toUTCMidnight } from '../engine/dateUtils.js';
import type { BatchInput, ConsumptionRateInput, RecurringSupplyInput, SimulationResult } from '../engine/types.js';
import { assertItemOwnership } from './items.service.js';
import type { Batch, ConsumptionRate, RecurringSupplySchedule } from '@prisma/client';

export class ProjectionUnavailableError extends Error {}

const DEFAULT_HORIZON_DAYS = 365;

async function loadItemForProjection(userId: string, itemId: string) {
  await assertItemOwnership(userId, itemId);
  const item = await prisma.item.findUniqueOrThrow({
    where: { id: itemId },
    include: {
      consumptionRate: true,
      recurringSupplySchedule: true,
      batches: { where: { status: 'ACTIVE' } },
    },
  });
  if (!item.consumptionRate) {
    throw new ProjectionUnavailableError('Set a consumption rate before projecting stock for this item');
  }
  return item;
}

function toBatchInputs(batches: Batch[]): BatchInput[] {
  return batches.map((b) => ({
    id: b.id,
    expiryDate: b.expiryDate,
    quantityRemaining: Number(b.quantityRemaining),
    receivedDate: b.receivedDate,
  }));
}

function toConsumptionRateInput(rate: ConsumptionRate): ConsumptionRateInput {
  return { ratePerPeriod: Number(rate.ratePerPeriod), periodUnit: rate.periodUnit };
}

function resolveRecurringSupply(
  schedule: RecurringSupplySchedule | null,
  batches: BatchInput[],
): RecurringSupplyInput | null {
  if (!schedule || !schedule.isActive) return null;

  const soonestActiveExpiry = [...batches]
    .filter((b) => b.quantityRemaining > 0)
    .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())[0]?.expiryDate;
  const assumedExpiry = schedule.assumedExpiryForFuture ?? soonestActiveExpiry;
  if (!assumedExpiry) return null;

  return {
    intervalValue: schedule.intervalValue,
    intervalUnit: schedule.intervalUnit,
    quantityPerDelivery: Number(schedule.quantityPerDelivery),
    nextDeliveryDate: schedule.nextExpectedDeliveryDate,
    assumedExpiryForFuture: assumedExpiry,
  };
}

export async function getProjection(
  userId: string,
  itemId: string,
  options: { horizonDays?: number; includeFutureDeliveries?: boolean } = {},
): Promise<SimulationResult> {
  const item = await loadItemForProjection(userId, itemId);
  const batchInputs = toBatchInputs(item.batches);
  const consumptionRate = toConsumptionRateInput(item.consumptionRate!);
  const includeFutureDeliveries = options.includeFutureDeliveries ?? true;
  const recurringSupply = includeFutureDeliveries
    ? resolveRecurringSupply(item.recurringSupplySchedule, batchInputs)
    : null;

  return simulate(batchInputs, consumptionRate, recurringSupply, {
    startDate: new Date(),
    horizonDays: options.horizonDays ?? DEFAULT_HORIZON_DAYS,
    includeFutureDeliveries,
  });
}

export interface ProjectionSummary {
  stockOutDate: Date | null;
  daysOfStockRemaining: number | null;
  nextExpiryDate: Date | null;
  requestNewerExpiryFromDate: Date | null;
  lastAcceptableDateForCurrentExpiry: Date | null;
  atRiskExpiryDate: Date | null;
  hasExpiryWasteWarning: boolean;
  nextDeliveryRecommendedQuantity: number | null;
}

export async function getProjectionSummary(userId: string, itemId: string): Promise<ProjectionSummary> {
  const item = await loadItemForProjection(userId, itemId);
  const batchInputs = toBatchInputs(item.batches);
  const today = toUTCMidnight(new Date());

  const result = await getProjection(userId, itemId, {
    horizonDays: DEFAULT_HORIZON_DAYS,
    includeFutureDeliveries: true,
  });

  const nextExpiryDate = [...batchInputs]
    .filter((b) => b.quantityRemaining > 0)
    .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())[0]?.expiryDate ?? null;

  const unsafeEvent = result.events.find((e) => e.type === 'DELIVERY_UNSAFE_FOR_CURRENT_EXPIRY');

  return {
    stockOutDate: result.stockOutDate,
    daysOfStockRemaining: result.stockOutDate ? diffInDays(result.stockOutDate, today) : null,
    nextExpiryDate,
    requestNewerExpiryFromDate: result.requestNewerExpiryFromDate,
    lastAcceptableDateForCurrentExpiry: result.lastAcceptableDateForCurrentExpiry,
    atRiskExpiryDate: unsafeEvent?.expiryDate ?? null,
    hasExpiryWasteWarning: result.expiryWasteEvents.length > 0,
    nextDeliveryRecommendedQuantity: result.nextDeliveryRecommendedQuantity,
  };
}

export async function evaluateCandidate(
  userId: string,
  itemId: string,
  candidate: { quantity: number; expiryDate: Date },
) {
  const item = await loadItemForProjection(userId, itemId);
  const batchInputs = toBatchInputs(item.batches);
  const consumptionRate = toConsumptionRateInput(item.consumptionRate!);

  return evaluateCandidateBatch(batchInputs, consumptionRate, candidate, { startDate: new Date() });
}
