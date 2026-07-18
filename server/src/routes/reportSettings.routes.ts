import { Router } from 'express';
import * as reportSettingsController from '../controllers/reportSettings.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const reportSettingsRouter = Router();

reportSettingsRouter.use(requireAuth);
reportSettingsRouter.get('/', asyncHandler(reportSettingsController.getSettings));
reportSettingsRouter.put('/', asyncHandler(reportSettingsController.saveSettings));
reportSettingsRouter.post('/test-email', asyncHandler(reportSettingsController.sendTestEmail));
