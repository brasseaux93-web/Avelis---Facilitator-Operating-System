import { registerAgendaLedgerRoutes } from './agendaLedgerRoutes';
import { registerMinuteRoutes } from './minuteRoutes';
import { registerProcessCopilotRoutes } from './processCopilotRoutes';

export function registerSessionContentRoutes(
  app: express.Express,
  requireAuth: express.RequestHandler
) {
  registerAgendaLedgerRoutes(app, requireAuth);
  registerMinuteRoutes(app, requireAuth);
  registerProcessCopilotRoutes(app, requireAuth);
}