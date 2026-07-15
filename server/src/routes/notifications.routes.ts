import { Router } from 'express';
import * as notificationsController from '../controllers/notifications.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get('/notification-preferences', asyncHandler(notificationsController.listPreferences));
notificationsRouter.put('/notification-preferences', asyncHandler(notificationsController.upsertPreferences));
notificationsRouter.get('/notification-logs', asyncHandler(notificationsController.listLogs));
