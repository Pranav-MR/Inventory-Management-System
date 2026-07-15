export type PeriodUnit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export interface BatchInput {
  id: string;
  expiryDate: Date;
  quantityRemaining: number;
  receivedDate: Date;
}

export interface ConsumptionRateInput {
  ratePerPeriod: number;
  periodUnit: PeriodUnit;
}

export interface RecurringSupplyInput {
  intervalValue: number;
  intervalUnit: PeriodUnit;
  quantityPerDelivery: number;
  nextDeliveryDate: Date;
  assumedExpiryForFuture: Date;
}

export interface SimulationOptions {
  startDate: Date;
  horizonDays: number;
  includeFutureDeliveries: boolean;
}

export type SimulationEvent =
  | { type: 'BATCH_EXPIRED_WITH_WASTE'; batchId: string; wastedQuantity: number; date: Date }
  | { type: 'BATCH_DEPLETED'; batchId: string; date: Date }
  | { type: 'DELIVERY_RECEIVED'; batchId: string; quantity: number; date: Date; expiryDate: Date }
  | { type: 'STOCK_OUT'; date: Date }
  | { type: 'DELIVERY_UNSAFE_FOR_CURRENT_EXPIRY'; date: Date; expiryDate: Date };

export interface DayState {
  date: Date;
  totalRemaining: number;
  perBatch: { batchId: string; remaining: number }[];
}

export interface SimulationResult {
  days: DayState[];
  events: SimulationEvent[];
  stockOutDate: Date | null;
  expiryWasteEvents: Array<{ batchId: string; wastedQuantity: number; date: Date }>;
  lastAcceptableDateForCurrentExpiry: Date | null;
  requestNewerExpiryFromDate: Date | null;
}
