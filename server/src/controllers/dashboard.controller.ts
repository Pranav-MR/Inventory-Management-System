import type { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service.js';

export async function getSummary(req: Request, res: Response) {
  const summary = await dashboardService.getDashboardSummary(req.userId!);
  res.json(summary);
}
