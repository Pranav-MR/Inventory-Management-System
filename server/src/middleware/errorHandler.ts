import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AuthError } from '../services/auth.service.js';
import { ProjectionUnavailableError } from '../services/projection.service.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../lib/errors.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: err.flatten() });
    return;
  }
  if (err instanceof AuthError) {
    res.status(401).json({ error: err.message });
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message || 'Not found' });
    return;
  }
  if (err instanceof ForbiddenError) {
    res.status(403).json({ error: err.message || 'Forbidden' });
    return;
  }
  if (err instanceof ConflictError) {
    res.status(409).json({ error: err.message || 'Conflict' });
    return;
  }
  if (err instanceof ProjectionUnavailableError) {
    res.status(422).json({ error: err.message || 'Projection unavailable' });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
