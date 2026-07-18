import { prisma } from '../lib/prisma.js';
import type { ReportFrequency } from '@prisma/client';

export async function getReportSettings(userId: string) {
  return prisma.emailReportSettings.findUnique({ where: { userId } });
}

export async function upsertReportSettings(
  userId: string,
  input: { isEnabled: boolean; recipientEmails: string[]; frequency: ReportFrequency },
) {
  return prisma.emailReportSettings.upsert({
    where: { userId },
    create: { userId, ...input },
    update: { ...input },
  });
}
