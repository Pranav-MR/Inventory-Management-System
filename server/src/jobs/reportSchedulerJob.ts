import { prisma } from '../lib/prisma.js';
import { addMonths, diffInDays, toUTCMidnight } from '../engine/dateUtils.js';
import { generateInventoryReport } from '../services/report.service.js';
import { sendReportToRecipients } from '../reports/channels/EmailReportChannel.js';

function isDue(frequency: 'WEEKLY' | 'MONTHLY', lastSentAt: Date | null, today: Date): boolean {
  if (lastSentAt === null) return true;
  const lastSent = toUTCMidnight(lastSentAt);
  if (frequency === 'WEEKLY') {
    return diffInDays(today, lastSent) >= 7;
  }
  return lastSent <= addMonths(today, -1);
}

export async function runScheduledReportsJob(): Promise<void> {
  const today = toUTCMidnight(new Date());
  const settingsRows = await prisma.emailReportSettings.findMany({ where: { isEnabled: true } });

  for (const row of settingsRows) {
    if (!isDue(row.frequency, row.lastSentAt, today)) continue;
    if (row.recipientEmails.length === 0) continue;

    try {
      const report = await generateInventoryReport(row.userId, { frequency: row.frequency });
      const results = await sendReportToRecipients(report, row.recipientEmails);
      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        console.error(
          'Report send partially failed for settings',
          row.id,
          'recipients:',
          failed.map((f) => f.recipientEmail),
        );
      }

      // Only advance lastSentAt if at least one recipient actually got it — if every send
      // failed (e.g. SMTP outage), retry the whole period again tomorrow rather than skipping it.
      const anySuccess = results.some((r) => r.success);
      if (anySuccess) {
        // updateMany (not update) so a row deleted concurrently since the findMany above
        // just no-ops instead of throwing P2025.
        await prisma.emailReportSettings.updateMany({ where: { id: row.id }, data: { lastSentAt: new Date() } });
      }
    } catch (err) {
      console.error('Report send failed for settings', row.id, err);
    }
  }
}
