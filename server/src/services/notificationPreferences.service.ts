import type { NotificationChannelType, NotificationEventType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export async function listPreferences(userId: string) {
  return prisma.notificationPreference.findMany({ where: { userId } });
}

export async function upsertPreferences(
  userId: string,
  prefs: { eventType: NotificationEventType; channel: NotificationChannelType; isEnabled: boolean; leadTimeDays: number }[],
) {
  return prisma.$transaction(
    prefs.map((p) =>
      prisma.notificationPreference.upsert({
        where: { userId_eventType_channel: { userId, eventType: p.eventType, channel: p.channel } },
        create: { userId, ...p },
        update: { isEnabled: p.isEnabled, leadTimeDays: p.leadTimeDays },
      }),
    ),
  );
}

export async function listLogs(userId: string, options: { itemId?: string; limit?: number }) {
  return prisma.notificationLog.findMany({
    where: { userId, ...(options.itemId ? { itemId: options.itemId } : {}) },
    orderBy: { createdAt: 'desc' },
    take: options.limit ?? 50,
  });
}
