import { Router } from 'express';
import * as batchesController from '../controllers/batches.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const batchesRouter = Router({ mergeParams: true });

batchesRouter.get('/', asyncHandler(batchesController.list));
batchesRouter.post('/', asyncHandler(batchesController.create));
batchesRouter.post('/evaluate-candidate', asyncHandler(batchesController.evaluateCandidate));
batchesRouter.patch('/:batchId', asyncHandler(batchesController.update));
batchesRouter.delete('/:batchId', asyncHandler(batchesController.remove));
