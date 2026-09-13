import express from 'express';
import { registerSessionListOpenRoutes } from './sessionListOpenRoutes';
import { registerSessionCloseInviteRoutes } from './sessionCloseInviteRoutes';
import { registerInviteActionRoutes } from './inviteActionRoutes';
import { registerDestructionReceiptRoutes } from './destructionReceiptRoutes';

export function registerSessionLifecycleRoutes(
  app: express.Express,
  requireAuth: express.RequestHandler
) {
  registerSessionListOpenRoutes(app, requireAuth);
  registerSessionCloseInviteRoutes(app, requireAuth);
  registerInviteActionRoutes(app, requireAuth);
  registerDestructionReceiptRoutes(app, requireAuth);
}
