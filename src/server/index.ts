import crypto from 'node:crypto';
import express from 'express';
import { loadLocalEnv } from '../lib/loadEnv';

loadLocalEnv();
import { sql } from 'drizzle-orm';
import { ensureDevFacilitatorSeed } from './seedDev';
import { ensureDemoSeed, isDemoSeedEnabled } from './seedDemo';
import { requireAuth } from './middleware';
import { registerAuthRoutes } from './authRoutes';
import { registerSessionRoutes } from './sessionRoutes';
import { registerDemoRoutes } from './demoRoutes';
import { registerPartyRoutes } from './partyRoutes';
import { runDestructionCron } from './destructionWorker';
import {
  assertProductionObservabilityGuards,
  getMetricsSnapshot,
  logEvent,
  sanitizeRequestId,
} from '../lib/observability';
import { db } from '../db/index';
import { assertProductionKms } from '../lib/kms';

const app = express();

if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Helmet-like headers without a heavy dependency.
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.use((req, res, next) => {
  const header =
    typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'] : undefined;
  const requestId = sanitizeRequestId(header) || crypto.randomUUID();
  res.setHeader('x-request-id', requestId);
  const start = Date.now();
  res.on('finish', () => {
    logEvent('info', 'http_request', {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - start,
    });
  });
  next();
});

app.use(express.json());

const PORT = Number(process.env.API_PORT || process.env.PORT || 3001);

/** Liveness - process is up. */
app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true });
});

/** Readiness - database ping. */
app.get('/readyz', async (_req, res) => {
  try {
    await db.execute(sql`select 1`);
    res.status(200).json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

/** In-memory counters only - no content. */
app.get('/metrics', (_req, res) => {
  res.status(200).json(getMetricsSnapshot());
});

registerAuthRoutes(app);
registerSessionRoutes(app, requireAuth);
registerDemoRoutes(app);
registerPartyRoutes(app);

if (process.env.VITEST !== 'true') {
  try {
    assertProductionObservabilityGuards();
    assertProductionKms();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const seedPromise = isDemoSeedEnabled()
    ? ensureDemoSeed()
    : ensureDevFacilitatorSeed().then(() => ({ facilitatorEmail: null, sessionId: null }));

  seedPromise
    .catch((err) => logEvent('error', 'seed_failed', { error: String(err) }))
    .finally(() => {
      app.listen(PORT, () => {
        logEvent('info', 'api_listen', { port: PORT });
      });

      const intervalMin = Number(process.env.RETENTION_JOB_INTERVAL_MINUTES || 15);
      if (Number.isFinite(intervalMin) && intervalMin > 0) {
        const ms = intervalMin * 60 * 1000;
        logEvent('info', 'retention_cron_armed', { intervalMinutes: intervalMin });
        setInterval(() => {
          void runDestructionCron();
        }, ms);
      }
    });
}

export { app };
