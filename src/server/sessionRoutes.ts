import express from 'express';
import { registerSessionLifecycleRoutes } from './sessionLifecycleRoutes';
import { registerSessionContentRoutes } from './sessionContentRoutes';

export function registerSessionRoutes(
  app: express.Express,
  requireAuth: express.RequestHandler
) {
  registerSessionLifecycleRoutes(app, requireAuth);
  registerSessionContentRoutes(app, requireAuth);
}
