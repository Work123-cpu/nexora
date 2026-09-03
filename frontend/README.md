# Nexora Frontend

React 19 + TypeScript + Vite single-page application — the full Nexora UI. See the
[root README](../README.md) for how this fits with `backend/` and `ai-service/`.

## Setup

```bash
npm install
cp .env.example .env   # defaults already point at the local backend/AI service
npm run dev             # http://localhost:5173
```

Requires the backend running at `http://localhost:8081` (see
[`../backend/README.md`](../backend/README.md)) for real data — this app has no
built-in mock/offline mode.

## Environment variables (`.env`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL of the Spring Boot backend, e.g. `http://localhost:8081/api`. |
| `VITE_AI_SERVICE_URL` | Base URL of the FastAPI AI service, e.g. `http://localhost:8000`. |
| `VITE_USE_MOCK_AI` | `false` routes chat/summaries through the real AI service; `true` uses a canned mock response. |
| `VITE_USE_MOCK_FORECAST` | `false` routes demand forecasting through the AI service's trained models; `true` uses a naive average-usage projection. |

## Scripts

```bash
npm run dev       # start the dev server
npm run build     # type-check (tsc -b) then production build
npm run preview   # preview a production build locally
npm run lint       # Oxlint
npm test           # unit tests (vitest) — recommendation engine, health engine, BOM costing
npm run test:watch # vitest in watch mode
npm run test:e2e   # end-to-end tests (Playwright) — needs the dev server + backend running
```

## Source layout (`src/`)

```
app/        Router, layouts, top-level providers
features/   One folder per business feature (products, billing, market-intelligence, ...) —
            each with its own pages/, components/, hooks/, services/
shared/     Reusable UI components, hooks, and utilities used across features
services/   Cross-cutting API adapters (ai/, forecast/) with real vs. mock implementations
lib/        Pure business logic with no UI or network dependency (recommendation engine,
            health-score engine, sales-history calculations)
theme/      Chart color tokens
types/      Shared TypeScript entity types
```
