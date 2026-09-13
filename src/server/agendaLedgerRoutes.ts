import express from 'express';
import { registerAgendaRoutes } from './agendaRoutes';
import { registerLedgerRoutes } from './ledgerRoutes';

export function registerAgendaLedgerRoutes(
  app: express.Express,
  requireAuth: express.RequestHandler
) {
  registerAgendaRoutes(app, requireAuth);
  registerLedgerRoutes(app, requireAuth);
}
