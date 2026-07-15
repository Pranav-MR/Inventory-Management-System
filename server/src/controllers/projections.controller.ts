import type { Request, Response } from 'express';
import { z } from 'zod';
import * as projectionService from '../services/projection.service.js';

const projectionQuerySchema = z.object({
  horizonDays: z.coerce.number().int().positive().max(3650).optional(),
});

export async function getProjection(req: Request, res: Response) {
  const { horizonDays } = projectionQuerySchema.parse(req.query);
  const result = await projectionService.getProjection(req.userId!, req.params.itemId, { horizonDays });
  res.json(result);
}

export async function getProjectionSummary(req: Request, res: Response) {
  const summary = await projectionService.getProjectionSummary(req.userId!, req.params.itemId);
  res.json(summary);
}
