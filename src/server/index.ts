import express from 'express';
import { ensureDevFacilitatorSeed } from './seedDev';
import { requireAuth } from './middleware';
import { registerAuthRoutes } from './authRoutes';
import { registerSessionRoutes } from './sessionRoutes';

const app = express();
app.use(express.json());
const PORT = Number(process.env.API_PORT || process.env.PORT || 3001);

registerAuthRoutes(app);
registerSessionRoutes(app, requireAuth);

if (process.env.VITEST !== 'true') {
  ensureDevFacilitatorSeed()
    .catch((err) => console.error('[seed] startup seed error', err))
    .finally(() => {
      app.listen(PORT, () => {
        console.log(`API server listening on port ${PORT}`);
      });
    });
}

export { app };
