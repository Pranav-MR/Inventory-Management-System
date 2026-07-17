import { Router } from 'express';
import * as itemsController from '../controllers/items.controller.js';
import * as projectionsController from '../controllers/projections.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { batchesRouter } from './batches.routes.js';
import { consumptionRouter } from './consumption.routes.js';

export const itemsRouter = Router();

itemsRouter.use(requireAuth);

itemsRouter.get('/', asyncHandler(itemsController.list));
itemsRouter.post('/', asyncHandler(itemsController.create));
itemsRouter.get('/:itemId', asyncHandler(itemsController.get));
itemsRouter.patch('/:itemId', asyncHandler(itemsController.update));
itemsRouter.delete('/:itemId', asyncHandler(itemsController.archive));
itemsRouter.delete('/:itemId/permanent', asyncHandler(itemsController.remove));

itemsRouter.put('/:itemId/consumption-rate', asyncHandler(itemsController.putConsumptionRate));
itemsRouter.get('/:itemId/consumption-rate/history', asyncHandler(itemsController.getConsumptionRateHistory));
itemsRouter.put('/:itemId/recurring-supply', asyncHandler(itemsController.putRecurringSupply));
itemsRouter.delete('/:itemId/recurring-supply', asyncHandler(itemsController.deleteRecurringSupply));

itemsRouter.get('/:itemId/projection', asyncHandler(projectionsController.getProjection));
itemsRouter.get('/:itemId/projection/summary', asyncHandler(projectionsController.getProjectionSummary));

itemsRouter.use('/:itemId/batches', batchesRouter);
itemsRouter.use('/:itemId/consumption-entries', consumptionRouter);
