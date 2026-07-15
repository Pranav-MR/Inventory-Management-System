import type { ConsumptionRateInput, PeriodUnit, RecurringSupplyInput } from './types.js';

export function toUTCMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 86_400_000);
}

export function addMonths(date: Date, n: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const targetMonthIndex = month + n;
  const lastDayOfTargetMonth = daysInMonth(
    year + Math.floor(targetMonthIndex / 12),
    ((targetMonthIndex % 12) + 12) % 12,
  );
  return new Date(
    Date.UTC(year, targetMonthIndex, Math.min(day, lastDayOfTargetMonth)),
  );
}

export function addYears(date: Date, n: number): Date {
  return addMonths(date, n * 12);
}

export function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

export function diffInDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addPeriod(date: Date, value: number, unit: PeriodUnit): Date {
  switch (unit) {
    case 'DAY':
      return addDays(date, value);
    case 'WEEK':
      return addDays(date, value * 7);
    case 'MONTH':
      return addMonths(date, value);
    case 'YEAR':
      return addYears(date, value);
  }
}

export function ratePerDay(rate: ConsumptionRateInput, date: Date): number {
  switch (rate.periodUnit) {
    case 'DAY':
      return rate.ratePerPeriod;
    case 'WEEK':
      return rate.ratePerPeriod / 7;
    case 'MONTH':
      return rate.ratePerPeriod / daysInMonth(date.getUTCFullYear(), date.getUTCMonth());
    case 'YEAR':
      return rate.ratePerPeriod / daysInYear(date.getUTCFullYear());
  }
}

export function sumConsumptionCapacity(
  rate: ConsumptionRateInput,
  fromDateInclusive: Date,
  toDateInclusive: Date,
): number {
  let total = 0;
  let d = fromDateInclusive;
  while (d <= toDateInclusive) {
    total += ratePerDay(rate, d);
    d = addDays(d, 1);
  }
  return total;
}

export function generateDeliveryDates(
  schedule: RecurringSupplyInput,
  startDate: Date,
  horizonEndDateInclusive: Date,
): Date[] {
  const dates: Date[] = [];
  let cursor = toUTCMidnight(schedule.nextDeliveryDate);
  while (cursor <= horizonEndDateInclusive) {
    if (cursor >= startDate) {
      dates.push(cursor);
    }
    cursor = addPeriod(cursor, schedule.intervalValue, schedule.intervalUnit);
  }
  return dates;
}
