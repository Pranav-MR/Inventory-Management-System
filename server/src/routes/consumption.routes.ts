import { Router } from 'express';
import * as consumptionController from '../controllers/consumption.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const consumptionRouter = Router({ mergeParams: true });

consumptionRouter.get('/', asyncHandler(consumptionController.list));
consumptionRouter.post('/', asyncHandler(consumptionController.create));
consumptionRouter.patch('/:entryId', asyncHandler(consumptionController.update));
consumptionRouter.delete('/:entryId', asyncHandler(consumptionController.remove));
