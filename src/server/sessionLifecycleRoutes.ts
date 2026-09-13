import express from 'express';
import { registerSessionListOpenRoutes } from './sessionListOpenRoutes';
import { registerSessionCloseInviteRoutes } from './sessionCloseInviteRoutes';

export function registerSessionLifecycleRoutes(
  app: express.Express,
  requireAuth: express.RequestHandler
) {
  registerSessionListOpenRoutes(app, requireAuth);
  registerSessionCloseInviteRoutes(app, requireAuth);
}
