import { describe, expect, it } from 'vitest';
import { renderReportEmailBody } from './emailBodyTemplate.js';
import type { InventoryReportData } from '../services/report.service.js';

const emptyReport: InventoryReportData = {
  generatedAt: new Date('2026-07-18T00:00:00.000Z'),
  overview: { totalItems: 0, healthyItems: 0, lowStockItems: 0, expiringSoonItems: 0, actionRequiredItems: 0 },
  recommendations: [],
  lowStock: [],
  expiringSoon: [],
  upcomingDeliveries: [],
};

const populatedReport: InventoryReportData = {
  generatedAt: new Date('2026-07-18T00:00:00.000Z'),
  overview: { totalItems: 24, healthyItems: 18, lowStockItems: 3, expiringSoonItems: 2, actionRequiredItems: 1 },
  recommendations: [
    {
      itemName: 'Medicine A',
      message:
        'Recommendation: For the next batch, accept only 13 units. Do not accept the current expiry (November 2026). Request a batch with a later expiry instead.',
    },
  ],
  lowStock: [{ itemName: 'Bandages', currentStock: 8, lowStockThreshold: 20 }],
  expiringSoon: [{ itemName: 'Vitamin C', expiryMonthYear: 'November 2026', remainingQuantity: 15 }],
  upcomingDeliveries: [{ itemName: 'Paracetamol', deliveryDate: 'November 22, 2026' }],
};

describe('renderReportEmailBody', () => {
  it('uses the exact empty-state copy for every section when there is nothing to report', () => {
    const body = renderReportEmailBody(emptyReport);

    expect(body).toContain('Hello,\n\nHere is your latest inventory summary.');
    expect(body).toContain('No recommendations.');
    expect(body).toContain('No low stock items.');
    expect(body).toContain('No items expiring soon.');
    expect(body).toContain('No upcoming deliveries.');
  });

  it('renders populated sections with the exact required fields, in order', () => {
    const body = renderReportEmailBody(populatedReport);

    // Section headers are matched with a trailing newline so the "Expiring Soon: 2" overview
    // stat line (colon-space-digit) doesn't false-match the "Expiring Soon:" section header
    // (colon-newline).
    const overviewIndex = body.indexOf('Inventory Overview:');
    const recIndex = body.indexOf('Recommendation Section:');
    const lowStockIndex = body.indexOf('Low Stock:\n');
    const expiringIndex = body.indexOf('Expiring Soon:\n');
    const deliveriesIndex = body.indexOf('Upcoming Recurring Deliveries:');
    expect(overviewIndex).toBeGreaterThan(-1);
    expect(recIndex).toBeGreaterThan(overviewIndex);
    expect(lowStockIndex).toBeGreaterThan(recIndex);
    expect(expiringIndex).toBeGreaterThan(lowStockIndex);
    expect(deliveriesIndex).toBeGreaterThan(expiringIndex);

    expect(body).toContain('Total Items: 24');
    expect(body).toContain('Healthy Items: 18');
    expect(body).toContain('Low Stock Items: 3');
    expect(body).toContain('Expiring Soon: 2');
    expect(body).toContain('Action Required Items: 1');

    // The recommendation's leading "Recommendation: " prefix must not be duplicated under the header.
    expect(body).toContain(
      'Medicine A\n\nRecommendation:\nFor the next batch, accept only 13 units. Do not accept the current expiry (November 2026). Request a batch with a later expiry instead.',
    );

    expect(body).toContain('Bandages — Current Stock: 8, Low Stock Threshold: 20');
    expect(body).toContain('Vitamin C — Expiry: November 2026, Remaining Quantity: 15');
    expect(body).toContain('Paracetamol — Delivery Date: November 22, 2026');
  });
});
