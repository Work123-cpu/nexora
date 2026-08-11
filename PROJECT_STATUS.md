# Nexora — Project Status

**Last updated:** 2026-08-07
**Milestone:** Frontend-first build (~75% of overall project), no backend/database/auth/ML.

This document reflects the actual state of the repository. Re-generate or edit it whenever
scope changes — do not let it drift from what's actually implemented.

---

## 1. Repository Layout

```
Claude/
├── docs/                   Governing spec (PROJECT_MASTER_PROMPT, MASTER_INDEX, PROJECT_VISION)
├── frontend/               React 19 + TypeScript + Vite application (this milestone's main deliverable)
├── ai-service/             Isolated FastAPI + Groq wrapper service
├── PROJECT_STATUS.md       This file
└── README.md               Root pointer to frontend/ and ai-service/
```

## 2. Completed Modules (Frontend)

All 19 modules from the brief are implemented against a centralized mock data layer with
realistic, internally-consistent seed data (a fictional food & beverage manufacturer,
"Annapurna Foods & Beverages Pvt. Ltd." (India), ~40 products, 33 raw materials, 18 BOMs, 5 warehouses,
22 vendors, 42 purchase orders, 15 market indicators, notifications, calendar events, and
90-day inventory trend history).

| # | Module | What's implemented |
|---|---|---|
| 1 | **Login / Account** | Animated Login, Forgot Password, Reset Password (mock session, any credentials work); Profile (editable, persisted to mock session); Settings (theme, language, notification prefs, sign-out) |
| 2 | **AI Command Center** (home page) | Hero banner (optional React Three Fiber scene, lazy-loaded, gated off mobile/reduced-motion), Business Health gauge + category breakdown, Today's Priorities, Critical Alerts, Inventory/Supplier/Forecast overview cards, revenue stat cards + trend/category charts, Quick Actions, AI Recommendation cards, Business Calendar widget, Recent Activity feed, Business Insights, floating AI chat |
| 3 | **Products** | List (search/filter/sort/paginate), Detail (BOM linkage, inventory snapshot), Create, Edit, Delete (confirm dialog), categories |
| 4 | **Raw Materials** | List (search/filter by category, inventory-cards summary row), Detail (vendor, movement history, "used in products" reverse-lookup), units, perishable flag |
| 5 | **Bill of Materials** | List, Create, Edit — live material calculator (per-line cost incl. scrap %), Material Requirement Preview (production-quantity coverage check against real inventory) |
| 6 | **Inventory** | Dashboard (stat cards, low-stock cards, warehouse cards, 90-day trend chart w/ item picker, stock movement timeline, full filterable items table) |
| 7 | **Warehouse** | List (capacity bars, status), Detail (capacity gauge, location, manager, stored inventory table) |
| 8 | **Procurement** | Purchase Order list/detail/create, AI Recommendation → prefilled PO flow, Supplier Selection, Approval UI (role-gated), status Timeline, Recommendations page |
| 9 | **Vendors** | List (rating stars, performance snapshot), Detail (performance cards, 6-month analytics chart, materials supplied, PO history, contact details) |
| 10 | **Reports** | Business / Inventory / Procurement / Forecast / Supplier reports, each with charts + tables + real CSV export (client-side Blob download); PDF export is a UI-complete stub. **Forecast report is backed by real, trained ML models** — see §2a below |
| 11 | **Business Calendar** | Month grid + upcoming list, Government/Company/Supplier holidays + Maintenance, filterable |
| 12 | **AI Health Check** | Overall gauge, 7 category scores (Inventory/Supplier/Procurement/Forecast/Market Risk + **mocked** Database/Billing), AI-generated narrative summary, Warnings, AI Suggestions |
| 13 | **AI Chatbot** | Floating launcher + panel, markdown rendering, suggested-question chips, typing indicator, conversation persisted to localStorage |
| 14 | **AI Setup Wizard** | All 12 steps (Welcome → Company → Warehouses → Products → Raw Materials → BOM → Inventory → Suppliers → Billing → Calendar → Review → Completion), state persisted to localStorage |
| 15 | **AI Action Center** | Action Queue / Approved / Dismissed tabs, Approval Dialog with Business Impact Card + two-step confirmation, decisions persisted |
| 16 | **Market Intelligence** | 6 categories (commodity/fuel/exchange-rate/inflation/global-event/supply-chain-risk), sparkline history, **company-independence filter** (an indicator only drives a recommendation if it maps to a raw material this business actually uses) |
| 17 | **Notifications** | Unread section, priority badges, category badges, mark-read/mark-all-read (persisted), feeds the topbar bell badge |
| 18 | **User Profile / Preferences** | Covered under Account (Profile + Settings) above |
| 19 | **Help Center** | Ask-AI panel, tutorial cards, FAQ accordion, documentation list, support contact card |

## 2a. Demand Forecasting — real ML, not a stub

`ai-service/` now trains and serves genuine `XGBoost`/`Random Forest` demand forecasting models
(scikit-learn + xgboost), not a placeholder:

- **Data**: since no real sales history exists anywhere in this project, `ai-service/app/ml/data_generator.py`
  deterministically generates ~2 years of synthetic daily sales per product category (trend +
  weekly seasonality + Oct–Nov festive bump + noise), fixed-anchored so it's byte-identical across
  restarts. Every API response says so explicitly via `isSynthetic: true` — this is honestly
  labeled training fuel, never presented as real data.
- **Training**: both `XGBRegressor` and `RandomForestRegressor` are trained per category on a
  time-based train/validation split; the lower-MAE model is chosen automatically per category
  (in practice, both algorithms win on different categories — the comparison is real, not
  cosmetic) and persisted to disk via `joblib` (`ai-service/app/ml/artifacts/`, gitignored).
  Training runs in a background thread on service startup so it never blocks uvicorn from
  accepting connections; each category is isolated so one failing to train doesn't affect others.
- **Serving**: `POST /api/forecast/predict` does a recursive day-by-day rollout past the training
  window, scales the category model's output by the requesting product's real `avgDailyUsage`
  (one model serves every product in its category at the right absolute level), and aggregates to
  daily/weekly/monthly/quarterly as requested — satisfying the vision doc's explicit granularity
  requirement.
- **Frontend**: `frontend/src/services/forecast/` mirrors the `services/ai/` interface+mock+http+
  factory seam exactly (`VITE_USE_MOCK_FORECAST` toggle). `ForecastReport.tsx` shows real
  per-product projections, which model won, and a confidence figure. A down/unready forecast
  service degrades to the same naive avg-usage projection used in mock mode — verified end-to-end
  (killed the service mid-session, confirmed graceful fallback with no crash, then confirmed clean
  recovery on restart).

### Supporting architecture (not a numbered module, but load-bearing)

- **`lib/recommendation-engine/`** — deterministic rules (reorder point, safety stock, supplier
  risk, market impact) that read the real seed data graph (Products → BOM → Raw Materials →
  Inventory → Suppliers → Market) and produce the `AIRecommendation` objects shown everywhere.
  This is genuine logic today, not canned text — it's the seam where real ML/forecast models
  slot in later.
- **`lib/health-engine/`** — same pattern for the 7 business-health categories.
- **`services/ai/`** — `IAIService` interface + `mockAIAdapter` (grounded in recommendation/health
  engine output) + `httpAIAdapter` (calls the FastAPI service, fails soft) + env-driven factory.
- **`services/base/mockClient.ts`** — shared pagination/filter/sort/latency engine every feature
  service is built on.
- Full design system in `shared/ui/` (30+ primitives: Button, DataTable, Dialog, Drawer, Tabs,
  Toast, chart wrappers, etc.), theming (light/dark via CSS variables + Tailwind v4), responsive
  app shell with collapsible sidebar and mobile drawer.

## 3. Placeholders Prepared for Backend Integration

These exist today and are designed so wiring a real backend changes their **implementation**,
not their **call sites**:

- `frontend/src/shared/lib/apiClient.ts` — typed REST client for the future Spring Boot API. Not
  called anywhere yet.
- `frontend/src/services/ai/adapters/httpAIAdapter.ts` — calls `POST /api/ai/{chat,explain,summarize,help}`
  on the FastAPI service; fails soft on network error. Flip `VITE_USE_MOCK_AI=false` to activate.
- `frontend/src/services/forecast/adapters/httpForecastAdapter.ts` — same pattern, calls
  `POST /api/forecast/predict`; already live (`VITE_USE_MOCK_FORECAST=false` in `.env`), not just a
  placeholder — see §2a.
- Every feature's `*.service.ts` (`productService`, `rawMaterialService`, `bomService`,
  `inventoryService`, `warehouseService`, `vendorService`, `purchaseOrderService`) — REST-shaped
  async methods (pagination/filter/sort params, `Promise` returns) backed by the mock client today.
  Swapping the body to call `apiClient` is the intended migration path.
- `frontend/src/shared/lib/permissions.ts` + `frontend/src/app/router/RoleGuard.tsx` — a real
  role→action matrix and a guard component wired into a few sensitive actions (product delete, PO
  approval) today; currently permissive (logs a console TODO, never blocks). Ready for real
  enforcement once a real auth/roles backend exists.
- `frontend/src/app/router/ProtectedRoute.tsx` — explicit route-level auth guard, not yet needed
  since `AppShellLayout` self-guards, but ready for additional protected route trees.
- `frontend/src/features/auth/context/AuthContext.tsx` — mock session (`localStorage`), any
  email/password combination signs in. Swap `login()`'s body for a real API call.
- `ai-service/` itself — real, running FastAPI service; only the Groq API key is missing until
  supplied. Every endpoint returns a clean `503 ai_provider_unavailable` until then.

## 4. Remaining Backend Tasks (explicitly out of scope for this milestone)

- Spring Boot application backend (controllers/services/repositories/entities)
- MySQL schema + persistence (all current "writes" mutate in-memory seed arrays for the session)
- Real authentication/authorization backend + JWT
- Real Purchase Order / Inventory / Vendor persistence and REST APIs
- Real push/email/SMS notifications (Notification Center is currently populated from mock events)
- Real billing integration (Setup Wizard's Billing step is UI-only)
- PDF report generation (CSV export is real; PDF is a labeled "coming soon" stub)
- Connecting `ai-service`'s `GROQ_API_KEY` and switching the frontend to `VITE_USE_MOCK_AI=false`

## 5. Known Architectural Simplification (read this before extending)

The plan called for a strict rule: "components/hooks never import `mocks/seed/*` directly, only
through a feature's own `*.service.ts`." In practice, **cross-cutting read-only views** (Command
Center widgets, the 5 Reports, Market Intelligence, Business Calendar, the notifications hook)
import multiple seed modules directly, because they aggregate across several entities in ways
that don't map to one feature's CRUD service. Every feature's own **primary CRUD path** (Products,
Raw Materials, BOM, Inventory, Warehouses, Vendors, Purchase Orders) does go through its service
layer correctly — that's the seam that matters most for a real backend swap. Retrofitting the
display-only aggregations through service functions was judged not worth the effort for a mock
data layer; flag this if a future phase wants stricter layering.

## 6. Verified

- `npx tsc -b --noEmit` — clean, zero errors.
- `npm run build` — succeeds (one expected warning: the lazy-loaded, gated Three.js hero scene
  chunk is >500kB, which is fine since it only loads on desktop without reduced-motion).
- `ai-service`: boots via `uvicorn`, `/health` reports `groq_configured: false` without a key,
  `/api/ai/chat` correctly returns `503` without a key and `422` on invalid input, `/docs` serves
  interactive API docs.
- `ai-service` forecasting: all 6 category models train in under 5 seconds on boot;
  `/api/forecast/predict` verified for day/week/month granularities and an unknown-category
  fallback to "General"; corrupted-artifact test confirmed one bad category retrains in isolation
  while the other 5 load from cache and the server never stops serving; `422` confirmed on invalid
  input. Frontend verified live against real trained models (model badges match backend training
  logs per category), and the full kill-service → degrade → restart → recover cycle was exercised
  in-browser with zero crashes.
- Every route manually exercised end-to-end in-browser with zero console errors, including the
  reorder-recommendation → purchase-order-creation → approval flow and the market-intelligence
  company-relevance filter.

## 7. Stopping Point

Per the project rule, this session stops here. **Backend implementation (Spring Boot, MySQL,
real auth, ML forecasting) has not been started and should not begin automatically** — the next
phase should be scoped and kicked off as its own piece of work.
