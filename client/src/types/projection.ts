export type SimulationEvent =
  | { type: 'BATCH_EXPIRED_WITH_WASTE'; batchId: string; wastedQuantity: number; date: string }
  | { type: 'BATCH_DEPLETED'; batchId: string; date: string }
  | { type: 'DELIVERY_RECEIVED'; batchId: string; quantity: number; date: string; expiryDate: string }
  | { type: 'STOCK_OUT'; date: string }
  | { type: 'DELIVERY_UNSAFE_FOR_CURRENT_EXPIRY'; date: string; expiryDate: string };

export interface DayState {
  date: string;
  totalRemaining: number;
  perBatch: { batchId: string; remaining: number }[];
}

export interface SimulationResult {
  days: DayState[];
  events: SimulationEvent[];
  stockOutDate: string | null;
  expiryWasteEvents: Array<{ batchId: string; wastedQuantity: number; date: string }>;
  lastAcceptableDateForCurrentExpiry: string | null;
  requestNewerExpiryFromDate: string | null;
  nextDeliveryRecommendedQuantity: number | null;
}

export interface ProjectionSummary {
  stockOutDate: string | null;
  daysOfStockRemaining: number | null;
  nextExpiryDate: string | null;
  requestNewerExpiryFromDate: string | null;
  lastAcceptableDateForCurrentExpiry: string | null;
  atRiskExpiryDate: string | null;
  hasExpiryWasteWarning: boolean;
  nextDeliveryRecommendedQuantity: number | null;
}

export interface EvaluateCandidateResult {
  wouldCauseWaste: boolean;
  wastedQuantity: number;
  wastedDate: string | null;
}
