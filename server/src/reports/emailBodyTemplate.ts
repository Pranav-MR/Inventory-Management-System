import type { InventoryReportData } from '../services/report.service.js';

const RECOMMENDATION_PREFIX = 'Recommendation: ';

function stripRecommendationPrefix(message: string): string {
  return message.startsWith(RECOMMENDATION_PREFIX) ? message.slice(RECOMMENDATION_PREFIX.length) : message;
}

export function renderReportEmailBody(data: InventoryReportData): string {
  const recommendationsBlock =
    data.recommendations.length > 0
      ? data.recommendations
          .map((r) => `${r.itemName}\n\nRecommendation:\n${stripRecommendationPrefix(r.message)}`)
          .join('\n\n')
      : 'No recommendations.';

  const lowStockBlock =
    data.lowStock.length > 0
      ? data.lowStock
          .map(
            (e) =>
              `${e.itemName} — Current Stock: ${e.currentStock}, Low Stock Threshold: ${e.lowStockThreshold ?? 'Not set'}`,
          )
          .join('\n')
      : 'No low stock items.';

  const expiringSoonBlock =
    data.expiringSoon.length > 0
      ? data.expiringSoon
          .map((e) => `${e.itemName} — Expiry: ${e.expiryMonthYear}, Remaining Quantity: ${e.remainingQuantity}`)
          .join('\n')
      : 'No items expiring soon.';

  const upcomingDeliveriesBlock =
    data.upcomingDeliveries.length > 0
      ? data.upcomingDeliveries.map((e) => `${e.itemName} — Delivery Date: ${e.deliveryDate}`).join('\n')
      : 'No upcoming deliveries.';

  return `Hello,

Here is your latest inventory summary.

Inventory Overview:
Total Items: ${data.overview.totalItems}
Healthy Items: ${data.overview.healthyItems}
Low Stock Items: ${data.overview.lowStockItems}
Expiring Soon: ${data.overview.expiringSoonItems}
Action Required Items: ${data.overview.actionRequiredItems}

Recommendation Section:
${recommendationsBlock}

Low Stock:
${lowStockBlock}

Expiring Soon:
${expiringSoonBlock}

Upcoming Recurring Deliveries:
${upcomingDeliveriesBlock}

A PDF version of this report is attached.`;
}
