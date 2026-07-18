import type { Request, Response } from 'express';
import { z } from 'zod';
import type { EmailReportSettings } from '@prisma/client';
import * as reportSettingsService from '../services/reportSettings.service.js';
import { generateInventoryReport } from '../services/report.service.js';
import { sendReportToRecipients } from '../reports/channels/EmailReportChannel.js';

const recipientEmailsSchema = z
  .array(z.string().email())
  .min(1, 'At least one recipient email is required')
  .refine((emails) => new Set(emails.map((e) => e.toLowerCase())).size === emails.length, {
    message: 'Duplicate email addresses are not allowed',
  });

const settingsSchema = z.object({
  isEnabled: z.boolean(),
  recipientEmails: recipientEmailsSchema,
  frequency: z.enum(['WEEKLY', 'MONTHLY']),
});

const testEmailSchema = z.object({
  recipientEmails: recipientEmailsSchema,
  frequency: z.enum(['WEEKLY', 'MONTHLY']).optional().default('WEEKLY'),
});

function toDto(settings: EmailReportSettings | null) {
  if (!settings) {
    return { isEnabled: false, recipientEmails: [] as string[], frequency: 'WEEKLY' as const, lastSentAt: null };
  }
  return {
    isEnabled: settings.isEnabled,
    recipientEmails: settings.recipientEmails,
    frequency: settings.frequency,
    lastSentAt: settings.lastSentAt,
  };
}

export async function getSettings(req: Request, res: Response) {
  const settings = await reportSettingsService.getReportSettings(req.userId!);
  res.json(toDto(settings));
}

export async function saveSettings(req: Request, res: Response) {
  const input = settingsSchema.parse(req.body);
  const settings = await reportSettingsService.upsertReportSettings(req.userId!, input);
  res.json(toDto(settings));
}

export async function sendTestEmail(req: Request, res: Response) {
  const { recipientEmails, frequency } = testEmailSchema.parse(req.body);
  const report = await generateInventoryReport(req.userId!, { frequency });
  const results = await sendReportToRecipients(report, recipientEmails);
  const failed = results.filter((r) => !r.success);
  res.json({ sent: results.length - failed.length, failed: failed.length, failedAddresses: failed.map((f) => f.recipientEmail) });
}
