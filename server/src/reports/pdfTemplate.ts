import type { InventoryReportData } from '../services/report.service.js';

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statTile(label: string, value: number): string {
  return `<div class="stat"><div class="stat-value">${value}</div><div class="stat-label">${escapeHtml(label)}</div></div>`;
}

function emptyState(text: string): string {
  return `<p class="empty">${escapeHtml(text)}</p>`;
}

function section(title: string, bodyHtml: string, opts: { highlight?: boolean } = {}): string {
  return `<section class="${opts.highlight ? 'section highlight' : 'section'}"><h2>${escapeHtml(title)}</h2>${bodyHtml}</section>`;
}

function table(headers: string[], rows: string[][]): string {
  const head = `<tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
  const body = rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('');
  return `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

export function renderReportHtml(data: InventoryReportData): string {
  const overviewHtml = `<div class="stat-grid">
    ${statTile('Total Items', data.overview.totalItems)}
    ${statTile('Healthy Items', data.overview.healthyItems)}
    ${statTile('Low Stock Items', data.overview.lowStockItems)}
    ${statTile('Expiring Soon', data.overview.expiringSoonItems)}
    ${statTile('Action Required', data.overview.actionRequiredItems)}
  </div>`;

  const recommendationsHtml =
    data.recommendations.length > 0
      ? data.recommendations
          .map(
            (r) =>
              `<div class="rec-card"><div class="rec-item">${escapeHtml(r.itemName)}</div><div class="rec-message">${escapeHtml(r.message)}</div></div>`,
          )
          .join('')
      : emptyState('No recommendations.');

  const lowStockHtml =
    data.lowStock.length > 0
      ? table(
          ['Item Name', 'Current Stock', 'Low Stock Threshold'],
          data.lowStock.map((e) => [e.itemName, String(e.currentStock), e.lowStockThreshold != null ? String(e.lowStockThreshold) : 'Not set']),
        )
      : emptyState('No low stock items.');

  const expiringSoonHtml =
    data.expiringSoon.length > 0
      ? table(
          ['Item Name', 'Expiry', 'Remaining Quantity'],
          data.expiringSoon.map((e) => [e.itemName, e.expiryMonthYear, String(e.remainingQuantity)]),
        )
      : emptyState('No items expiring soon.');

  const upcomingDeliveriesHtml =
    data.upcomingDeliveries.length > 0
      ? table(
          ['Item Name', 'Delivery Date'],
          data.upcomingDeliveries.map((e) => [e.itemName, e.deliveryDate]),
        )
      : emptyState('No upcoming deliveries.');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1c1a27;
    margin: 0;
    padding: 32px 40px;
    font-size: 12.5px;
    line-height: 1.5;
  }
  header { border-bottom: 3px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; }
  h1 { font-size: 24px; margin: 0 0 6px 0; color: #0f172a; }
  .generated-date { color: #6b7280; font-size: 12px; }
  .section { margin-bottom: 24px; page-break-inside: avoid; }
  .section h2 {
    font-size: 14px; margin: 0 0 10px 0; padding-bottom: 6px;
    border-bottom: 1px solid #e5e3ea; color: #0f172a;
  }
  .section.highlight h2 { color: #1d4ed8; }
  .stat-grid { display: flex; gap: 10px; flex-wrap: wrap; }
  .stat {
    flex: 1; min-width: 90px; border: 1px solid #e5e3ea; border-radius: 8px;
    padding: 10px; text-align: center; background: #fafafd;
  }
  .stat-value { font-size: 20px; font-weight: 700; color: #0f172a; }
  .stat-label { font-size: 10px; color: #6b7280; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.03em; }
  .rec-card {
    border: 1px solid #dbeafe; border-left: 3px solid #3b82f6; border-radius: 8px;
    padding: 10px 14px; margin-bottom: 8px; background: #eff6ff;
  }
  .rec-item { font-weight: 700; margin-bottom: 4px; color: #0f172a; }
  .rec-message { color: #1e3a8a; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #eceaf3; font-size: 11.5px; }
  th { background: #f4f2fb; font-size: 10px; text-transform: uppercase; letter-spacing: 0.03em; color: #6b7280; }
  .empty { color: #9ca3af; font-style: italic; margin: 0; }
</style>
</head>
<body>
  <header>
    <h1>Inventory Summary Report</h1>
    <div class="generated-date">Generated on ${dateFormatter.format(data.generatedAt)}</div>
  </header>
  ${section('Inventory Overview', overviewHtml)}
  ${section('Recommendation Section', recommendationsHtml, { highlight: true })}
  ${section('Low Stock', lowStockHtml)}
  ${section('Expiring Soon', expiringSoonHtml)}
  ${section('Upcoming Recurring Deliveries', upcomingDeliveriesHtml)}
</body>
</html>`;
}
