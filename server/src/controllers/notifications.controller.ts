import type { Request, Response } from 'express';
import { z } from 'zod';
import * as prefsService from '../services/notificationPreferences.service.js';

const eventTypeSchema = z.enum([
  'LOW_STOCK',
  'STOCK_OUT_IMMINENT',
  'EXPIRY_WASTE_WARNING',
  'REQUEST_NEWER_BATCH',
  'CANDIDATE_BATCH_WASTE_WARNING',
  'UPCOMING_DELIVERY_REMINDER',
]);
const channelSchema = z.enum(['EMAIL', 'SMS', 'WHATSAPP']);

const preferenceSchema = z.object({
  eventType: eventTypeSchema,
  channel: channelSchema,
  isEnabled: z.boolean(),
  leadTimeDays: z.number().int().min(0),
});

const bulkPreferencesSchema = z.array(preferenceSchema);

const logsQuerySchema = z.object({
  itemId: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export async function listPreferences(req: Request, res: Response) {
  const prefs = await prefsService.listPreferences(req.userId!);
  res.json(prefs);
}

export async function upsertPreferences(req: Request, res: Response) {
  const input = bulkPreferencesSchema.parse(req.body);
  const prefs = await prefsService.upsertPreferences(req.userId!, input);
  res.json(prefs);
}

export async function listLogs(req: Request, res: Response) {
  const { itemId, limit } = logsQuerySchema.parse(req.query);
  const logs = await prefsService.listLogs(req.userId!, { itemId, limit });
  res.json(logs);
}
