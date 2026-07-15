import type { NotificationChannelType, NotificationEventType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { channelRegistry } from '../notifications/registry.js';
import { renderTemplate, type TemplateContext } from '../notifications/templates.js';

function buildDedupeKey(
  itemId: string | null,
  eventType: NotificationEventType,
  channel: NotificationChannelType,
  date: Date,
): string {
  return `${itemId ?? 'user'}:${eventType}:${channel}:${date.toISOString().slice(0, 10)}`;
}

/**
 * Dispatches a notification for one event, one time per (item, event, channel, day) —
 * dedupeKey's unique constraint is what makes the daily job idempotent on reruns.
 */
export async function dispatchNotification(params: {
  userId: string;
  itemId: string | null;
  eventType: NotificationEventType;
  context: TemplateContext;
  date?: Date;
}): Promise<void> {
  const date = params.date ?? new Date();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: params.userId } });

  const prefs = await prisma.notificationPreference.findMany({
    where: { userId: params.userId, eventType: params.eventType, isEnabled: true },
  });
  const channels: NotificationChannelType[] = prefs.length > 0 ? prefs.map((p) => p.channel) : ['EMAIL'];

  const { subject, body } = renderTemplate(params.eventType, params.context);

  for (const channelType of channels) {
    const dedupeKey = buildDedupeKey(params.itemId, params.eventType, channelType, date);
    const existing = await prisma.notificationLog.findUnique({ where: { dedupeKey } });
    if (existing) continue;

    const log = await prisma.notificationLog.create({
      data: {
        userId: params.userId,
        itemId: params.itemId,
        eventType: params.eventType,
        channel: channelType,
        subject,
        body,
        status: 'PENDING',
        dedupeKey,
      },
    });

    const channel = channelRegistry.get(channelType);
    const to = channelType === 'EMAIL' ? user.email : null;

    if (!channel || !to) {
      await prisma.notificationLog.update({
        where: { id: log.id },
        data: { status: 'FAILED', error: !channel ? `No channel implementation for ${channelType}` : 'No destination address for channel' },
      });
      continue;
    }

    const result = await channel.send({ to, subject, body });
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: result.success ? { status: 'SENT', sentAt: new Date() } : { status: 'FAILED', error: result.error },
    });
  }
}
