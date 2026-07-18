import type { ReportChannel } from './ReportChannel.js';
import type { InventoryReportData } from '../../services/report.service.js';
import { renderReportHtml } from '../pdfTemplate.js';
import { renderReportPdf } from '../pdfRenderer.js';
import { renderReportEmailBody } from '../emailBodyTemplate.js';
import { sendMail, type MailAttachment } from '../mailer.js';

async function buildReportEmailPayload(report: InventoryReportData): Promise<{ text: string; attachments: MailAttachment[] }> {
  const html = renderReportHtml(report);
  const pdfBuffer = await renderReportPdf(html);
  return {
    text: renderReportEmailBody(report),
    attachments: [{ filename: 'inventory-summary-report.pdf', content: pdfBuffer, contentType: 'application/pdf' }],
  };
}

export const emailReportChannel: ReportChannel = {
  type: 'EMAIL',
  async send(report: InventoryReportData, recipientEmail: string): Promise<void> {
    const { text, attachments } = await buildReportEmailPayload(report);
    await sendMail({ to: recipientEmail, subject: 'Inventory Summary Report', text, attachments });
  },
};

export interface RecipientSendResult {
  recipientEmail: string;
  success: boolean;
  error?: string;
}

/**
 * Sends the same report to every recipient, rendering the PDF/body only once and reusing it
 * across all sends. A failure for one recipient is logged and does not stop the rest.
 */
export async function sendReportToRecipients(
  report: InventoryReportData,
  recipientEmails: string[],
): Promise<RecipientSendResult[]> {
  const { text, attachments } = await buildReportEmailPayload(report);

  const results: RecipientSendResult[] = [];
  for (const recipientEmail of recipientEmails) {
    try {
      await sendMail({ to: recipientEmail, subject: 'Inventory Summary Report', text, attachments });
      results.push({ recipientEmail, success: true });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error('Failed to send report to', recipientEmail, error);
      results.push({ recipientEmail, success: false, error });
    }
  }
  return results;
}
