export type PeriodUnit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
export type BatchStatus = 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'DISCARDED';

export interface ConsumptionRate {
  ratePerPeriod: number;
  periodUnit: PeriodUnit;
}

export interface RecurringSupplySchedule {
  intervalValue: number;
  intervalUnit: PeriodUnit;
  quantityPerDelivery: number;
  nextExpectedDeliveryDate: string;
  assumedExpiryForFuture: string | null;
  isActive: boolean;
}

export interface Batch {
  id: string;
  batchLabel: string | null;
  receivedDate: string;
  expiryDate: string;
  quantityReceived: number;
  quantityRemaining: number;
  quantityAsOfDate: string;
  status: BatchStatus;
}

export interface Item {
  id: string;
  name: string;
  unit: string;
  category: string | null;
  lowStockThreshold: number | null;
  isArchived: boolean;
  createdAt: string;
  consumptionRate: ConsumptionRate | null;
  recurringSupplySchedule: RecurringSupplySchedule | null;
  batches: Batch[];
}
