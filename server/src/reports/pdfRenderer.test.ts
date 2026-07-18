import { describe, expect, it } from 'vitest';
import { renderReportHtml } from './pdfTemplate.js';
import { renderReportPdf } from './pdfRenderer.js';
import type { InventoryReportData } from '../services/report.service.js';

const fixture: InventoryReportData = {
  generatedAt: new Date('2026-07-18T00:00:00.000Z'),
  overview: { totalItems: 10, healthyItems: 7, lowStockItems: 1, expiringSoonItems: 1, actionRequiredItems: 1 },
  recommendations: [{ itemName: 'Medicine A', message: 'Recommendation: For the next batch, accept only 13 units. Do not accept the current expiry (November 2026). Request a batch with a later expiry instead.' }],
  lowStock: [{ itemName: 'Bandages', currentStock: 8, lowStockThreshold: 20 }],
  expiringSoon: [{ itemName: 'Vitamin C', expiryMonthYear: 'November 2026', remainingQuantity: 15 }],
  upcomingDeliveries: [{ itemName: 'Paracetamol', deliveryDate: 'November 22, 2026' }],
};

describe('renderReportPdf', () => {
  it('produces a well-formed, non-trivial PDF buffer', async () => {
    const html = renderReportHtml(fixture);
    const pdf = await renderReportPdf(html);

    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.length).toBeGreaterThan(1000);
  }, 30000);
});
