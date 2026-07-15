import { prisma } from '../lib/prisma.js';
import { getProjectionSummary } from './projection.service.js';

export interface DashboardSummary {
  totalItems: number;
  lowStockCount: number;
  expiringSoonCount: number;
  actionNeededCount: number;
}

const LOW_STOCK_DAYS_THRESHOLD = 14;
const EXPIRING_SOON_DAYS_THRESHOLD = 30;

export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  const items = await prisma.item.findMany({ where: { userId, isArchived: false }, select: { id: true } });

  let lowStockCount = 0;
  let expiringSoonCount = 0;
  let actionNeededCount = 0;

  for (const item of items) {
    const summary = await getProjectionSummary(userId, item.id).catch(() => null);
    if (!summary) continue; // consumption rate not set yet

    if (summary.daysOfStockRemaining !== null && summary.daysOfStockRemaining <= LOW_STOCK_DAYS_THRESHOLD) {
      lowStockCount++;
    }
    if (summary.nextExpiryDate) {
      const daysUntilExpiry = Math.round((new Date(summary.nextExpiryDate).getTime() - Date.now()) / 86_400_000);
      if (daysUntilExpiry >= 0 && daysUntilExpiry <= EXPIRING_SOON_DAYS_THRESHOLD) expiringSoonCount++;
    }
    if (summary.requestNewerExpiryFromDate) actionNeededCount++;
  }

  return { totalItems: items.length, lowStockCount, expiringSoonCount, actionNeededCount };
}
