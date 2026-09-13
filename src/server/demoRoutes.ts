import express from 'express';
import {
  ensureDemoSeed,
  isDemoPrepareAllowed,
  isDemoSeedEnabled,
  prepareDemo,
} from './seedDemo';

export function registerDemoRoutes(app: express.Express) {
  /** Safe status — no secrets. */
  app.get('/api/demo/status', async (_req, res) => {
    try {
      const enabled = isDemoSeedEnabled();
      const prepareAllowed = isDemoPrepareAllowed();
      let sessionId: string | null = null;
      if (enabled) {
        const seeded = await ensureDemoSeed();
        sessionId = seeded.sessionId;
      }
      res.status(200).json({
        demoSeedEnabled: enabled,
        prepareAllowed,
        sessionId,
        paths: {
          demoPage: '/demo',
          auth: '/auth',
          sessions: '/sessions',
          join: '/join',
          demoScript: '/docs/demo-script.md',
        },
      });
    } catch (error) {
      console.error('[API] demo status failed', error instanceof Error ? error.message : 'unknown');
      res.status(500).json({ error: 'Could not read demo status.' });
    }
  });

  /** Dev/demo only — prepares seed facilitator + optional draft session. */
  app.post('/api/demo/prepare', async (_req, res) => {
    if (!isDemoPrepareAllowed()) {
      return res.status(403).json({ error: 'Demo prepare is not available in this environment.' });
    }
    try {
      const prepared = await prepareDemo();
      res.status(200).json({
        facilitatorEmailHint: prepared.facilitatorEmailHint,
        sessionId: prepared.sessionId,
        joinPath: prepared.joinPath,
        instructions: prepared.instructions,
      });
    } catch (error) {
      console.error('[API] demo prepare failed', error instanceof Error ? error.message : 'unknown');
      res.status(500).json({ error: 'Could not prepare demo.' });
    }
  });
}
