import { prisma } from '../lib/prisma.js';
import { getProjectionSummary } from './projection.service.js';
import { getRecentActivity } from './activity.service.js';
import { addDays, diffInDays, generateDeliveryDates, toUTCMidnight } from '../engine/dateUtils.js';

export interface DashboardSummary {
  totalItems: number;
  lowStockCount: number;
  expiringSoonCount: number;
  actionNeededCount: number;
}

const LOW_STOCK_DAYS_THRESHOLD = 14;
const EXPIRING_SOON_DAYS_THRESHOLD = 30;
// The dashboard widget only ever previews a handful of rows (client-side); this
// is the cap for the "complete history" the View More modal scrolls through.
const RECENT_ACTIVITY_LIMIT = 50;

type ExpiringSoonGroup = 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'LATER';

export interface ExpiringSoonEntry {
  itemId: string;
  itemName: string;
  unit: string;
  group: ExpiringSoonGroup;
  daysRemaining: number;
  affectedQuantity: number;
  batchCount: number;
}

export interface LowStockEntry {
  itemId: string;
  itemName: string;
  unit: string;
  currentQuantity: number;
  daysOfStockRemaining: number;
}

export interface UpcomingRecurringEntry {
  itemId: string;
  itemName: string;
  unit: string;
  nextDeliveryDate: Date;
  quantityPerDelivery: number;
  daysUntil: number;
}

export interface DashboardOverview {
  summary: DashboardSummary;
  expiringSoon: ExpiringSoonEntry[];
  lowStock: LowStockEntry[];
  upcomingRecurring: UpcomingRecurringEntry[];
  recentActivity: Awaited<ReturnType<typeof getRecentActivity>>;
  overview: {
    totalBatches: number;
    archivedItems: number;
    totalActiveItems: number;
    lastInventoryUpdate: Date | null;
  };
  filterItemIds: {
    lowStock: string[];
    expiringSoon: string[];
    needsAction: string[];
  };
}

function groupForDays(days: number): ExpiringSoonGroup {
  if (days <= 0) return 'TODAY';
  if (days === 1) return 'TOMORROW';
  if (days <= 7) return 'THIS_WEEK';
  return 'LATER';
}

export async function getDashboardOverview(userId: string): Promise<DashboardOverview> {
  const today = toUTCMidnight(new Date());

  const items = await prisma.item.findMany({
    where: { userId, isArchived: false },
    include: { batches: true, recurringSupplySchedule: true },
  });

  const expiringSoon: ExpiringSoonEntry[] = [];
  const lowStock: LowStockEntry[] = [];
  const upcomingRecurring: UpcomingRecurringEntry[] = [];
  const needsActionIds: string[] = [];

  for (const item of items) {
    // --- Expiring soon: pure batch-date arithmetic, no consumption rate required. ---
    const activeBatches = item.batches.filter((b) => b.status === 'ACTIVE' && Number(b.quantityRemaining) > 0);
    const soonBatches = activeBatches
      .map((b) => ({ batch: b, daysRemaining: diffInDays(toUTCMidnight(b.expiryDate), today) }))
      .filter((b) => b.daysRemaining >= 0 && b.daysRemaining <= EXPIRING_SOON_DAYS_THRESHOLD);
    if (soonBatches.length > 0) {
      const daysRemaining = Math.min(...soonBatches.map((b) => b.daysRemaining));
      const affectedQuantity = soonBatches.reduce((sum, b) => sum + Number(b.batch.quantityRemaining), 0);
      expiringSoon.push({
        itemId: item.id,
        itemName: item.name,
        unit: item.unit,
        group: groupForDays(daysRemaining),
        daysRemaining,
        affectedQuantity,
        batchCount: soonBatches.length,
      });
    }

    // --- Upcoming recurring supply: next actual delivery date, not the possibly-stale stored one. ---
    const schedule = item.recurringSupplySchedule;
    if (schedule?.isActive) {
      const [nextDeliveryDate] = generateDeliveryDates(
        {
          intervalValue: schedule.intervalValue,
          intervalUnit: schedule.intervalUnit,
          quantityPerDelivery: Number(schedule.quantityPerDelivery),
          nextDeliveryDate: schedule.nextExpectedDeliveryDate,
          assumedExpiryForFuture: schedule.nextExpectedDeliveryDate,
        },
        today,
        addDays(today, 365),
      );
      if (nextDeliveryDate) {
        upcomingRecurring.push({
          itemId: item.id,
          itemName: item.name,
          unit: item.unit,
          nextDeliveryDate,
          quantityPerDelivery: Number(schedule.quantityPerDelivery),
          daysUntil: diffInDays(nextDeliveryDate, today),
        });
      }
    }

    // --- Low stock / needs action: projection-based, requires a consumption rate. ---
    const summary = await getProjectionSummary(userId, item.id).catch(() => null);
    if (!summary) continue;

    if (summary.daysOfStockRemaining !== null && summary.daysOfStockRemaining <= LOW_STOCK_DAYS_THRESHOLD) {
      const currentQuantity = activeBatches.reduce((sum, b) => sum + Number(b.quantityRemaining), 0);
      lowStock.push({
        itemId: item.id,
        itemName: item.name,
        unit: item.unit,
        currentQuantity,
        daysOfStockRemaining: summary.daysOfStockRemaining,
      });
    }
    if (summary.requestNewerExpiryFromDate) {
      needsActionIds.push(item.id);
    }
  }

  expiringSoon.sort((a, b) => a.daysRemaining - b.daysRemaining);
  lowStock.sort((a, b) => a.daysOfStockRemaining - b.daysOfStockRemaining);
  upcomingRecurring.sort((a, b) => a.nextDeliveryDate.getTime() - b.nextDeliveryDate.getTime());

  const [totalBatches, archivedItems, latestItem, latestBatch, recentActivity] = await Promise.all([
    prisma.batch.count({ where: { item: { userId } } }),
    prisma.item.count({ where: { userId, isArchived: true } }),
    prisma.item.findFirst({ where: { userId }, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
    prisma.batch.findFirst({ where: { item: { userId } }, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
    getRecentActivity(userId, RECENT_ACTIVITY_LIMIT),
  ]);

  const lastInventoryUpdate = [latestItem?.updatedAt, latestBatch?.updatedAt]
    .filter((d): d is Date => d != null)
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  return {
    summary: {
      totalItems: items.length,
      lowStockCount: lowStock.length,
      expiringSoonCount: expiringSoon.length,
      actionNeededCount: needsActionIds.length,
    },
    expiringSoon,
    lowStock,
    upcomingRecurring,
    recentActivity,
    overview: {
      totalBatches,
      archivedItems,
      totalActiveItems: items.length,
      lastInventoryUpdate,
    },
    filterItemIds: {
      lowStock: lowStock.map((e) => e.itemId),
      expiringSoon: expiringSoon.map((e) => e.itemId),
      needsAction: needsActionIds,
    },
  };
}

export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  const { summary } = await getDashboardOverview(userId);
  return summary;
}
