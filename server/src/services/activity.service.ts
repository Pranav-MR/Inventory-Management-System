import { prisma } from '../lib/prisma.js';
import type { ActivityType } from '@prisma/client';

/**
 * Best-effort audit trail for the dashboard's "Recent Activity" feed. Logging
 * failures must never break the mutation that triggered them, so errors are
 * swallowed here rather than propagated to callers.
 */
export async function logActivity(params: {
  userId: string;
  itemId: string | null;
  itemName: string;
  type: ActivityType;
  message: string;
}) {
  try {
    await prisma.activityLog.create({ data: params });
  } catch (err) {
    console.error('Failed to log activity', err);
  }
}

export async function getRecentActivity(userId: string, limit: number) {
  return prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
