import { describe, expect, it, vi } from 'vitest';

const sendMailMock = vi.fn();
vi.mock('../mailer.js', () => ({ sendMail: (...args: unknown[]) => sendMailMock(...args) }));

const { sendReportToRecipients } = await import('./EmailReportChannel.js');
const { renderReportHtml } = await import('../pdfTemplate.js');
const { renderReportPdf } = await import('../pdfRenderer.js');
vi.mock('../pdfTemplate.js', () => ({ renderReportHtml: vi.fn(() => '<html></html>') }));
vi.mock('../pdfRenderer.js', () => ({ renderReportPdf: vi.fn(async () => Buffer.from('%PDF-fake')) }));

const fixture = {
  generatedAt: new Date('2026-07-18T00:00:00.000Z'),
  overview: { totalItems: 0, healthyItems: 0, lowStockItems: 0, expiringSoonItems: 0, actionRequiredItems: 0 },
  recommendations: [],
  lowStock: [],
  expiringSoon: [],
  upcomingDeliveries: [],
};

describe('sendReportToRecipients', () => {
  it('continues sending to remaining recipients when one fails, and reports per-recipient results', async () => {
    sendMailMock.mockReset();
    sendMailMock.mockImplementation(async ({ to }: { to: string }) => {
      if (to === 'bad@example.com') throw new Error('SMTP rejected');
    });

    const results = await sendReportToRecipients(fixture, ['good1@example.com', 'bad@example.com', 'good2@example.com']);

    expect(sendMailMock).toHaveBeenCalledTimes(3);
    expect(results).toEqual([
      { recipientEmail: 'good1@example.com', success: true },
      { recipientEmail: 'bad@example.com', success: false, error: 'SMTP rejected' },
      { recipientEmail: 'good2@example.com', success: true },
    ]);
  });

  it('renders the PDF and email body only once regardless of recipient count', async () => {
    sendMailMock.mockReset();
    sendMailMock.mockResolvedValue(undefined);
    vi.mocked(renderReportHtml).mockClear();
    vi.mocked(renderReportPdf).mockClear();

    await sendReportToRecipients(fixture, ['a@example.com', 'b@example.com', 'c@example.com']);

    expect(renderReportHtml).toHaveBeenCalledTimes(1);
    expect(renderReportPdf).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledTimes(3);
  });
});
