import { getDashboardOverview } from './dashboard.service.js';
import { getProjectionSummary, ProjectionUnavailableError } from './projection.service.js';
import { listItems } from './items.service.js';
import { decimalToNumber } from '../lib/decimal.js';
import { describeNextDeliveryRecommendation, getNormalPurchaseQuantity, hasRecommendation } from '../lib/recommendationText.js';

const monthYearFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
const fullDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export interface InventoryOverviewData {
  totalItems: number;
  healthyItems: number;
  lowStockItems: number;
  expiringSoonItems: number;
  actionRequiredItems: number;
}

export interface RecommendationEntry {
  itemName: string;
  message: string;
}

export interface LowStockReportEntry {
  itemName: string;
  currentStock: number;
  lowStockThreshold: number | null;
}

export interface ExpiringSoonReportEntry {
  itemName: string;
  expiryMonthYear: string;
  remainingQuantity: number;
}

export interface UpcomingDeliveryReportEntry {
  itemName: string;
  deliveryDate: string;
}

export interface InventoryReportData {
  generatedAt: Date;
  overview: InventoryOverviewData;
  recommendations: RecommendationEntry[];
  lowStock: LowStockReportEntry[];
  expiringSoon: ExpiringSoonReportEntry[];
  upcomingDeliveries: UpcomingDeliveryReportEntry[];
}

const UPCOMING_DELIVERY_WINDOW_DAYS: Record<'WEEKLY' | 'MONTHLY', number> = {
  WEEKLY: 7,
  MONTHLY: 30,
};

export async function generateInventoryReport(
  userId: string,
  options: { frequency: 'WEEKLY' | 'MONTHLY' },
): Promise<InventoryReportData> {
  const [dashboard, items] = await Promise.all([getDashboardOverview(userId), listItems(userId)]);
  const itemsById = new Map(items.map((item) => [item.id, item]));

  const totalItems = dashboard.overview.totalActiveItems;
  const distressedIds = new Set([
    ...dashboard.filterItemIds.lowStock,
    ...dashboard.filterItemIds.expiringSoon,
    ...dashboard.filterItemIds.needsAction,
  ]);

  const overview: InventoryOverviewData = {
    totalItems,
    healthyItems: totalItems - distressedIds.size,
    lowStockItems: dashboard.lowStock.length,
    expiringSoonItems: dashboard.expiringSoon.length,
    actionRequiredItems: dashboard.summary.actionNeededCount,
  };

  const recommendations: RecommendationEntry[] = [];
  for (const item of items) {
    const summary = await getProjectionSummary(userId, item.id).catch((err) => {
      if (err instanceof ProjectionUnavailableError) return null;
      throw err;
    });
    if (!summary) continue;

    const normalPurchaseQuantity = getNormalPurchaseQuantity({
      recurringSupplySchedule: item.recurringSupplySchedule
        ? { isActive: item.recurringSupplySchedule.isActive, quantityPerDelivery: decimalToNumber(item.recurringSupplySchedule.quantityPerDelivery)! }
        : null,
      batches: item.batches.map((b) => ({ receivedDate: b.receivedDate, quantityReceived: decimalToNumber(b.quantityReceived)! })),
    });

    if (
      hasRecommendation({
        nextDeliveryRecommendedQuantity: summary.nextDeliveryRecommendedQuantity,
        atRiskExpiryDate: summary.atRiskExpiryDate,
        normalPurchaseQuantity,
      })
    ) {
      recommendations.push({
        itemName: item.name,
        message: describeNextDeliveryRecommendation(summary.atRiskExpiryDate, summary.nextDeliveryRecommendedQuantity!),
      });
    }
  }
  recommendations.sort((a, b) => a.itemName.localeCompare(b.itemName));

  const lowStock: LowStockReportEntry[] = dashboard.lowStock.map((entry) => ({
    itemName: entry.itemName,
    currentStock: entry.currentQuantity,
    lowStockThreshold: decimalToNumber(itemsById.get(entry.itemId)?.lowStockThreshold ?? null),
  }));

  const expiringSoon: ExpiringSoonReportEntry[] = dashboard.expiringSoon.map((entry) => {
    const item = itemsById.get(entry.itemId);
    const soonestExpiry = item
      ? [...item.batches]
          .filter((b) => b.status === 'ACTIVE' && decimalToNumber(b.quantityRemaining)! > 0)
          .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())[0]?.expiryDate
      : undefined;
    return {
      itemName: entry.itemName,
      expiryMonthYear: soonestExpiry ? monthYearFormatter.format(soonestExpiry) : '—',
      remainingQuantity: entry.affectedQuantity,
    };
  });

  const windowDays = UPCOMING_DELIVERY_WINDOW_DAYS[options.frequency];
  const upcomingDeliveries: UpcomingDeliveryReportEntry[] = dashboard.upcomingRecurring
    .filter((entry) => entry.daysUntil <= windowDays)
    .map((entry) => ({
      itemName: entry.itemName,
      deliveryDate: fullDateFormatter.format(entry.nextDeliveryDate),
    }));

  return {
    generatedAt: new Date(),
    overview,
    recommendations,
    lowStock,
    expiringSoon,
    upcomingDeliveries,
  };
}
