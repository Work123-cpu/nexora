# Nexora — Roadmap to 100% (Planned, Not Yet Started)

This document tracks the plan for finishing Nexora into a real, multi-company,
production-usable product — and its status. **As of this update, real backend mode
is the default** (`VITE_USE_MOCK_BACKEND=false` in `frontend/.env`): the app requires
MySQL + the Spring Boot backend running and a real registered account, the same as a
finished product would. Mock mode still exists as an explicit opt-in fallback for
offline UI exploration only (`VITE_USE_MOCK_BACKEND=true`).

Companion documents:
- `PROJECT_STATUS.md` — what is already built and verified today (do not duplicate that
  content here; this file only covers what's *left*).

Decisions already locked in:
- **Database**: MySQL Community Server, installed and run **locally on the user's own
  laptop** (`localhost:3306`) — free, no cloud hosting, no license cost. Matches the
  tech stack already stated in the original project spec.
- **Backend framework**: Spring Boot (Java), as originally specified.
- **No architecture rewrite**: every phase below plugs into seams that already exist
  (`*.service.ts` mock-to-HTTP swap points, `apiClient.ts`, `AuthContext.tsx`,
  `permissions.ts`/`RoleGuard.tsx`) — see `PROJECT_STATUS.md §3` for the full list.

---

## Phase 1 — Data-layer completeness (foundation) — ✅ COMPLETE

**Goal**: every entity a company owns can be created/edited/deleted through the UI, not
just read. Required before Phase 2/3 have anything real to persist.

1. **Raw Materials CRUD** ✅ — `createRawMaterial`/`updateRawMaterial`/
   `deleteRawMaterial` in `rawMaterialService.ts`, `RawMaterialForm`,
   `RawMaterialCreatePage`/`RawMaterialEditPage`, `DeleteRawMaterialDialog`, routes and
   list/detail buttons wired.
2. **Vendor & Warehouse CRUD** ✅ — same pattern applied to `vendorService.ts` and
   `warehouseService.ts`: `VendorForm`/`WarehouseForm`, create/edit pages, delete
   dialogs, routes, list "Add" buttons, detail edit/delete actions.
3. **Configurable category taxonomy** ✅ — `frontend/src/shared/lib/categoryStore.ts`
   (localStorage-backed) + `frontend/src/shared/ui/CategorySelect.tsx` (a Select with
   an inline "+ New category" affordance), wired into `ProductForm`, `RawMaterialForm`,
   and `VendorForm`. Verified live: added a "Furniture" product category and created a
   product in it with zero console errors — proving a non-bakery company can extend
   every category taxonomy from the form itself, no code change or backend needed.

**Verified**: `npx tsc -b --noEmit` and `npm run build` clean; live in-browser
create/edit/delete pass for Raw Materials, Vendors, and Warehouses, plus the new
category flow, all with zero console errors.

**Acceptance**: a user can fully create a brand-new product end-to-end — new raw
materials, new BOM referencing them, new product, even in a brand-new category — without
touching seed files.

4. **Bulk CSV import** ✅ — `shared/lib/csv.ts` (dependency-free parser) +
   `shared/ui/BulkImportDialog.tsx` (generic preview/validate/commit flow), with
   `mapProductCsvRow`/`mapRawMaterialCsvRow` mappers in each feature's `lib/csvMapper.ts`.
   Wired into both list pages and reused inside the Setup Wizard (Phase 2). Verified
   live: uploaded a 2-row CSV with one invalid row — the bad row was flagged and
   skipped, the valid row was created, zero console errors.

---

## Phase 2 — Onboarding that actually onboards (multi-company readiness) — ✅ COMPLETE

**Goal**: this is the direct fix for "how does a non-bakery company use this" — and per
the user's follow-up request, the real goal is **easy setup for any company that
adopts this project**, not just technical multi-tenancy.

1. **Wire the Setup Wizard to real services** ✅ — the Products/Raw Materials/
   Warehouses/Suppliers wizard steps (`DataSteps.tsx`, `IntroSteps.tsx`,
   `IntegrationSteps.tsx`) now offer real "Add manually" links and bulk-CSV-import
   buttons that call the actual `create*` services from Phase 1, instead of only
   displaying read-only stats.
2. **Bulk CSV import inside the wizard** ✅ — reuses the same `BulkImportDialog` and
   CSV mappers built in Phase 1.
3. **Blank-slate / reset mode** ✅ — `frontend/src/mocks/resetAllMockData.ts` clears
   every mock "table" in place (products, raw materials, BOM, warehouses, vendors,
   purchase orders, inventory) plus any custom categories, exposed via a "Clear demo
   data & start fresh" action on the wizard's Company step and a "Reset to blank slate"
   danger-zone action on the new Company Settings page.
4. **Company Settings page** ✅ — `frontend/src/shared/lib/companyConfig.ts`
   (localStorage-backed name/logo/currencyCode/locale) + a new "Company Profile" card
   on `SettingsPage.tsx` (logo upload, name, a currency/locale preset picker).
   `formatters.ts` now reads currency/locale dynamically instead of hardcoded
   `en-IN`/`INR` constants. **Verified live**: switched to USD in Settings and every
   price on the Raw Materials page instantly reformatted from ₹ to $ with zero
   code-path changes, then reverted back to INR.

**Acceptance**: completing the Setup Wizard as a fictional non-food company (e.g. a
textile or electronics distributor) — either by typing entries manually or bulk-importing
a CSV — results in that company's own products/materials showing up everywhere in the
app — Command Center, Inventory, Reports, AI recommendations — with zero bakery data
left over, and its name/currency/logo visible via Company Settings.

---

## Phase 3 — Real backend: Spring Boot + local MySQL — ✅ COMPLETE

**Goal**: replace the in-memory mock layer with real persistence, on the user's laptop,
at zero cost.

1. **Local MySQL setup** ✅ — MySQL Community Server 8.4 installed via `winget`,
   data directory initialized, running locally on `127.0.0.1:3306` (started directly
   via `mysqld.exe`, not as a Windows service, since service registration needs admin
   rights this environment doesn't have — see `backend/README.md` for exact commands).
   `nexora` schema + `nexora_app` user created.
2. **Spring Boot project** ✅ — full Maven project in `backend/`: entities, repositories,
   services, and controllers for Company, User, Product, RawMaterial, BillOfMaterials,
   Warehouse, Vendor, InventoryItem, PurchaseOrder — every entity row carries a
   `company_id` for multi-tenancy. **Compiles clean** (`mvn compile` → BUILD SUCCESS)
   and **boots clean** against live MySQL — Hibernate auto-created all 13 tables.
3. **Real JWT authentication** ✅ — `POST /api/auth/register` / `POST /api/auth/login`
   (BCrypt password hashing, `jjwt`-issued tokens), a `JwtAuthFilter` validating every
   request, and `SecurityConfig` enforcing auth on all `/api/**` routes except
   `/api/auth/**`. **Verified live**: register → login → 401 without a token → a
   second company registered and confirmed to see zero rows from the first company's
   data (`GET /api/products` returned `[]`).
4. **Service-layer swap — Product, as the proof of concept** ✅ — `apiClient.ts` now
   attaches the JWT automatically; `AuthContext.tsx` and
   `features/products/services/productService.ts` branch on `VITE_USE_MOCK_BACKEND`
   between the existing mock body and a new `httpProductService` calling the real API.
   **Verified live end-to-end through the actual browser UI**: logged in as a real
   registered user, saw only that company's one product (not the 34-item bakery demo),
   created "Silk Saree Premium" through the real `/app/products/new` form, and
   confirmed it landed in the MySQL `products` table via direct SQL query. Reverted
   `VITE_USE_MOCK_BACKEND` back to `true` afterward so the default demo still shows
   the full bakery dataset.
5. **Service-layer swap — the rest of the entities** ✅ — the exact same pattern
   repeated for `rawMaterialService.ts`, `vendorService.ts`, `warehouseService.ts`,
   `bomService.ts`, `inventoryService.ts` (read-only), and
   `purchaseOrderService.ts` (including the `advance-status` action). Two small
   shared exports (`fromBackendPO` from `purchaseOrderService.ts`,
   `fromBackendInventoryItem` from `inventoryService.ts`) avoid duplicating mapping
   logic where one feature reads another's data (vendor's PO history, warehouse's
   inventory list). **Verified live end-to-end for every one of the 6**: created a
   real raw material, vendor, warehouse, and BOM, and created + approved a real
   purchase order — all confirmed landing in MySQL via direct SQL query — then
   reverted `VITE_USE_MOCK_BACKEND` back to `true`.
   - **Known residual limitation**: a few forms (`BomForm`, `PurchaseOrderCreatePage`)
     still source their dropdown options (which product, which vendor/material) by
     directly importing the mock seed arrays rather than through the now-real
     services, a pre-existing pattern from the original build
     (`PROJECT_STATUS.md §5`, "cross-cutting reads"). In real-backend mode this means
     those dropdowns show bakery demo names rather than the logged-in company's own
     data, even though the record created is correctly saved for that company. Not
     fixed in this pass — flagged so it isn't mistaken for a hidden bug.
6. **Real backend made the default, with a genuine sign-up flow** ✅ (per user
   request to "remove the demo things and keep the project as a completed project") —
   `VITE_USE_MOCK_BACKEND=false` is now the default in both `frontend/.env` and
   `.env.example`. Since mock mode's "any password signs you in" no longer applies,
   added a real `RegisterPage.tsx` (`/register`) and `AuthContext.register()` calling
   `POST /api/auth/register`; `LoginPage.tsx`'s false "demo environment" disclaimer
   and pre-filled demo credentials were removed. The mock-only "Clear demo data /
   Reset to blank slate" actions (`CompanyStep`, Settings' Danger Zone) are now
   hidden in real-backend mode, since they only ever touched the mock arrays and
   would otherwise be a misleading no-op against real MySQL data.
   - **Bug found and fixed during this switch**: `RawMaterialListPage`,
     `VendorListPage`, and `PurchaseOrderListPage`'s summary stat cards (e.g. "Total
     Materials: 33") were reading the mock seed arrays directly instead of the live
     query result, so a brand-new company with zero real data still saw bakery-scale
     numbers above an empty table. Fixed by deriving every stat from the same
     real data the table uses (an unpaginated fetch for the true totals, since the
     table view itself is paginated). Verified live: registered a fresh company
     ("Ganges Furniture Works") through the actual UI — every stat card correctly
     showed 0/₹0 for its genuinely empty catalog.
   - **Vendor Portal is intentionally unchanged** — it still shows "Demo environment
     — any password signs you in" because that remains literally true; vendors
     aren't `User` rows in the backend and there's no vendor login endpoint. Real
     per-vendor accounts are still future hardening work (Phase 4b), not something
     this pass could honestly remove the disclaimer for.
7. **Remaining "old demo data" sweep** ✅ (per user request "remove all the demo
   data i will give data and keep a startup wizard for new users") — the residual
   limitation flagged in item 5 above turned out to be much larger once audited:
   `recommendation-engine` and `health-engine` (the actual AI Recommendations and
   Business Health Score features) were **always** computed from the hardcoded mock
   bakery data regardless of which real company was logged in — a real functional
   bug, not cosmetic. Fixed by making every rule function accept its data as
   arguments instead of importing mock seed at module scope, adding
   `shared/hooks/useRecommendations.ts` / `useBusinessHealth.ts` to supply real data
   from the live backend, and updating all 9 call sites (Command Center, AI Health
   Check, Recommendations page, Market Intelligence). `marketImpact.rule.ts` and
   `getRelevantIndicatorsFor()` now match a company's real raw materials by name
   instead of by the demo catalog's IDs (which could never match a real company's
   generated IDs).
   - Also fixed: every remaining `getVendorById`/`getInventoryByItemId`/etc. direct
     mock-seed lookup across list/detail pages, `BomForm`, `PurchaseOrderCreatePage`,
     `VendorForm`, `RawMaterialForm`, and the raw-material CSV importer's vendor
     validation (all now resolve against the real backend).
   - **"Revenue" was fabricated from day one** — this platform has no Sales/Revenue
     entity in the real backend, only Purchase Orders (spend, not sales). Repurposed
     the Command Center's Revenue widgets and `BusinessReport` into real
     **Procurement Spend** analytics (`shared/lib/procurementAnalytics.ts`) computed
     from actual purchase orders, rather than inventing sales data that doesn't exist
     anywhere in the product's domain model.
   - `RecentActivityPanel` now derives from real PO status-timeline events instead of
     a static mock activity feed; `useNotifications` now derives live alerts from
     real critical/low stock, in-transit/received POs, and under-review vendors
     instead of a static mock notification list.
   - `ForecastReport`'s tracked products/inventory now come from the real backend;
     its fabricated "last 30 days order volume" chart (no real order-volume concept
     exists) was replaced with a genuinely real multi-period ML demand projection
     (`horizon=8`) summed across the company's own tracked products.
   - **Setup Wizard was itself showing demo data** — every step (`Products`,
     `Raw Materials`, `BOM`, `Inventory`, `Warehouses`, `Suppliers`, `Review`) read
     mock seed counts directly, so a brand-new company's onboarding wizard falsely
     claimed "Total Products: 12" etc. before they'd added anything. All steps now
     read live data via the real hooks. `WizardContext`'s hardcoded "Annapurna Foods
     & Beverages Pvt. Ltd." default was removed (blank, prefilled from the real
     registered company name instead); a `RegisterPage` → `/app` redirect race
     (declarative `AuthLayout` redirect winning over the imperative `navigate`) was
     fixed via a one-shot `sessionStorage` flag, so new users now reliably land on
     `/setup` instead of the Command Center.
   - **Left as honest, labeled gaps, not silently faked**: `InventoryTrendsChart` and
     `StockMovementTimeline` now show a "not tracked yet" empty state in real-backend
     mode instead of fabricated 90-day/movement history, since no backend entity
     stores that yet. Business Calendar / Market Intelligence's external
     commodity/holiday feed remains generic reference data (not company-specific),
     consistent with there being no real market-data or holiday-calendar API
     integrated. Vendor Portal auth is unchanged (see item 6).
   - **Verified live end-to-end**: registered a fresh company via
     `POST /api/auth/register`, walked its Command Center, Recommendations,
     Notifications, Forecast Report, and the full 12-step Setup Wizard in-browser —
     every number was a genuine 0/₹0/empty-state, zero leftover bakery data anywhere,
     zero console errors. `npx tsc -b --noEmit`, `npm test` (17/17), and
     `npm run build` all clean.

**Acceptance** (met for the swapped slice): stopping and restarting the Spring Boot app
does not lose data — it's on disk in MySQL, not in JVM memory. Two different company
accounts see fully isolated data, verified live.

---

## Phase 4 — Close remaining feature gaps

Independent, can be done in any order, each already scoped in `PROJECT_STATUS.md §4`:

- Real push/email/SMS notifications (Notification Center is mock-event-driven today) —
  **explicitly skipped for now, by user choice** (asked SendGrid vs. Twilio vs. skip;
  user chose skip). The integration point is well-defined (fire on PO status change,
  same place `advanceStatus` already runs) whenever this is revisited.
- Real billing integration (Setup Wizard's Billing step is UI-only today) —
  **explicitly skipped for now, by user choice** (asked Stripe vs. QuickBooks vs. skip;
  user chose skip).
- **PDF report generation** ✅ — `jspdf` + `jspdf-autotable` added as real dependencies;
  `frontend/src/shared/lib/exportPdf.ts` generates a branded table PDF (company name
  from Company Settings, report title, timestamp) reused across all 5 Reports pages'
  `ExportMenu`, plus a "Download PDF" button on both the internal and vendor-portal
  Purchase Order detail pages. Verified live, zero console errors.
- **Live Groq AI** ✅ — user obtained a free Groq API key and added it to
  `ai-service/.env`. Service restarted, `/health` confirms `groq_configured: true`,
  and `VITE_USE_MOCK_AI=false` was already set in `frontend/.env`. **Verified live
  through the actual chatbot UI**: asked "What is 47 times 6, and name one Indian
  spice?" and got back a genuinely computed answer ("47 times 6 is 282. One Indian
  spice is Turmeric.") — proof it's real inference, not a canned mock string.

---

## Phase 4b — Vendor Portal (new) — ✅ MVP COMPLETE

**Goal**: today, nothing in the app ever actually notifies a vendor that a PO exists —
"Ordered" is just a status label a staff member sets. A vendor portal is what turns
that into a real two-way workflow: vendors log in, see their own orders, and act on
them, and the internal team sees that action reflected live on the PO timeline.

**MVP (buildable now, on the existing mock architecture — no backend dependency):**
1. **Separate vendor-facing auth.** A lightweight `VendorAuthContext` mirroring the
   existing mock pattern in `frontend/src/features/auth/context/AuthContext.tsx` (any
   email/password signs in for the demo), but the session resolves to a single
   `vendorId` from `vendors.seed.ts` rather than a staff user.
2. **Isolated route tree**, e.g. `/vendor-portal/*`, with its own minimal layout — no
   19-module sidebar, just "My Orders" — kept structurally separate from `/app/*` so
   internal and vendor UIs never leak into each other.
3. **Vendor Orders List** — purchase orders filtered to
   `po.vendorId === currentVendor.id` via the existing `purchaseOrderService.getPurchaseOrders({ vendorId })`
   (already supports this filter), showing PO number, status, total, expected delivery.
4. **Vendor Order Detail + actions** — line items and timeline (reusing
   `POTimeline.tsx`), plus two vendor-initiated actions calling the existing
   `purchaseOrderService.advanceStatus`: **"Acknowledge Order"** and **"Mark Shipped"**.
   No new persistence mechanism needed — it's the same mock `purchaseOrders` array the
   internal team already reads, so a vendor's action is immediately visible on
   `PurchaseOrderDetailPage`'s timeline for staff.

**Hardening (depends on Phase 3 / Phase 4):**
- Once Spring Boot + MySQL exist, vendor logins become real per-vendor accounts
  (`vendor_id`-scoped rows, real passwords) instead of the single mock login stand-in.
- Once real email exists (Phase 4), a PO reaching `approved` sends the vendor an email
  with a link into their portal — closing the original gap ("vendors don't know we
  placed an order").
- Once PDF generation exists (Phase 4), the vendor portal's order detail offers a
  downloadable PO PDF, matching what a real vendor would expect to receive.

**Acceptance**: a vendor can log into their own portal, see only their own POs,
acknowledge one, and mark it shipped — and that status change is immediately visible
on the internal team's `PurchaseOrderDetailPage` timeline, with no manual sync step.

---

## Phase 5 — User-friendliness polish — ✅ MOSTLY COMPLETE (see notes)

- First-run empty states on every list page ("No raw materials yet — add your first
  one" + CTA) instead of just a spinner/skeleton.
- A short guided tour tied to Setup Wizard completion.
- Accessibility pass: keyboard navigation, ARIA labels, color-contrast check on the
  glass/3D-effect surfaces.
- Mobile/responsive audit across all 19 modules (only spot-checked so far).
- **Apple-style visual polish** (added per user request): scroll-reveal animations on
  dashboards/reports (`whileInView`), a frosted/blurred sticky top nav, extending the
  existing cursor-reactive glow in `frontend/src/shared/ui/Tilt3D.tsx` into a colored
  ambient spotlight, animated number counters on stat cards, smooth `AnimatePresence`
  route transitions, a circular-reveal theme toggle, magnetic primary buttons, and a
  real public landing page before login built on the existing `AuthHero3D`/
  `CommandCenterHero3D` R3F scenes (currently built but unused pre-login).
- **Command palette (Ctrl/Cmd+K)** (added per user request): fast fuzzy search and
  navigation/actions across all 19 modules (e.g. "Add raw material", "Go to Forecast
  Report") — a global keyboard-triggered overlay, not tied to any one feature.

---

## Phase 6 — Testing & deployment hardening — ✅ COMPLETE

- **Unit tests** ✅ — `vitest` added; 15 real tests across 3 files for the
  recommendation engine, health engine, and BOM cost calculator, asserting real
  invariants (severity ordering, confidence bounds, the "company independence" rule,
  score-to-status thresholds, cost formula correctness) — not placeholder assertions.
  `npm test` → 15/15 passing.
- **End-to-end tests** ✅ — `@playwright/test` added (Chromium installed locally);
  3 real specs in `frontend/e2e/`: reorder recommendation → PO creation → approval,
  full Setup Wizard completion, and the Forecast Report's model badges + granularity
  switch. `npm run test:e2e` → 3/3 passing.
- **Setup documentation** ✅ — root `README.md` rewritten to cover all three pieces
  (frontend/ai-service/backend) with exact run commands; `backend/README.md` covers
  the full MySQL + Spring Boot local setup in detail, including the admin-rights
  workaround for running MySQL without a registered Windows service.

---

## Suggested execution order

Phase 1 → Phase 2 → Phase 4b MVP (vendor portal, no backend needed yet) → Phase 5
(cheap, high visible payoff) → Phase 3 → Phase 4 (incl. Phase 4b hardening) → Phase 6.

## How to start

Say **"complete the project"** to execute this roadmap phase by phase, or name a
specific phase/item (e.g. "start Phase 1" or "do the Raw Materials CRUD") to begin
there directly.
