# Playwright E2E

Hybrid UI + API tests for the facilitator session lifecycle.

## Prerequisites

```bash
cp .env.compose.example .env
# set JWT_SECRET, ROOM_SHARED_SECRET, LOCAL_DEV_* keys
docker compose up --build -d
```

In another terminal (UI + local API/room if not using only compose API):

```bash
cp .env.example.txt .env
# ENABLE_DEMO_SEED=true recommended for /demo prepare
npm install
npx playwright install chromium
npm run dev
```

Compose exposes API `127.0.0.1:3001` and room `127.0.0.1:3002`. Vite UI defaults to `http://127.0.0.1:5173` and proxies `/api` to the API.

## Run

```bash
# Soft-skip when services are down:
npm run test:e2e

# Require services (CI / docker path):
E2E_BASE_URL=http://127.0.0.1:5173 E2E_API_URL=http://127.0.0.1:3001 npm run test:e2e
```

Optional seed credentials:

```bash
FACILITATOR_SEED_EMAIL=facilitator@avelis.local
FACILITATOR_SEED_PASSWORD=change-me-now
```

## Specs

| File | Purpose |
|---|---|
| `tests/e2e/compliance.spec.ts` | Landing + join smoke; no localStorage |
| `tests/e2e/session-lifecycle.spec.ts` | Login → create → invite → join → agenda/minute → close |

## Speech-safety

Tests may send a live room message while connected. They **must not** assert chat history after leave or session close.
