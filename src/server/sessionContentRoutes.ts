import express from 'express';
import { registerAgendaLedgerRoutes } from './agendaLedgerRoutes';
import { registerMinuteRoutes } from './minuteRoutes';

export function registerSessionContentRoutes(
  app: express.Express,
  requireAuth: express.RequestHandler
) {
  registerAgendaLedgerRoutes(app, requireAuth);
  registerMinuteRoutes(app, requireAuth);
}
