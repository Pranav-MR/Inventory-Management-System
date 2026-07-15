import { diffInDays, toUTCMidnight } from './dateUtils.js';
import { simulate } from './simulate.js';
import type { BatchInput, ConsumptionRateInput } from './types.js';

const CANDIDATE_BATCH_ID = '__candidate__';

/**
 * Answers "if I accept this incoming batch right now, will it (or existing
 * stock sharing its expiry tier) go to waste?" by appending it as an
 * immediate batch and re-running the simulation, no persistence involved.
 */
export function evaluateCandidateBatch(
  batches: BatchInput[],
  consumptionRate: ConsumptionRateInput,
  candidate: { quantity: number; expiryDate: Date },
  options: { startDate: Date },
): { wouldCauseWaste: boolean; wastedQuantity: number; wastedDate: Date | null } {
  const startDate = toUTCMidnight(options.startDate);
  const candidateExpiry = toUTCMidnight(candidate.expiryDate);
  const horizonDays = Math.max(diffInDays(candidateExpiry, startDate) + 2, 1);

  const augmentedBatches: BatchInput[] = [
    ...batches,
    { id: CANDIDATE_BATCH_ID, expiryDate: candidateExpiry, quantityRemaining: candidate.quantity, receivedDate: startDate },
  ];

  const result = simulate(augmentedBatches, consumptionRate, null, {
    startDate,
    horizonDays,
    includeFutureDeliveries: false,
  });

  const wasteEvent = result.expiryWasteEvents.find((e) => e.batchId === CANDIDATE_BATCH_ID);
  return {
    wouldCauseWaste: Boolean(wasteEvent),
    wastedQuantity: wasteEvent?.wastedQuantity ?? 0,
    wastedDate: wasteEvent?.date ?? null,
  };
}
