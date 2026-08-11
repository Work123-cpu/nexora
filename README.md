# Nexora — AI-Powered Smart Procurement & Inventory Management Platform

An enterprise-grade procurement, inventory, and supply-chain intelligence platform, running
on a real backend — not a demo. See [`docs/PROJECT_MASTER_PROMPT.md`](docs/PROJECT_MASTER_PROMPT.md)
and [`docs/01_PROJECT_VISION.md`](docs/01_PROJECT_VISION.md) for the governing spec,
[`PROJECT_STATUS.md`](PROJECT_STATUS.md) for the original 19-module milestone, and
[`PROJECT_ROADMAP.md`](PROJECT_ROADMAP.md) for everything built since (real backend, vendor
portal, bulk import, live AI, and more).

This repository has four pieces:

```
frontend/     React 19 + TypeScript + Vite — the full application UI
ai-service/   FastAPI + Groq + scikit-learn/XGBoost — AI chat + real demand forecasting
backend/      Spring Boot + MySQL — real persistence, JWT auth, multi-tenant data isolation
desktop/      Electron shell — packages the app as a native Windows desktop launcher
```

## Running it (all three, real data by default)

1. **Database + backend** — full setup in [`backend/README.md`](backend/README.md); summary:
   ```bash
   # one-time: install JDK 17 + MySQL Community Server (both free), create the schema
   # start MySQL, then:
   cd backend
   mvn spring-boot:run   # http://localhost:8081
   ```
2. **AI service** (optional but recommended — real chat + real forecasting):
   ```bash
   cd ai-service
   python -m venv .venv && .venv\Scripts\activate
   pip install -r requirements.txt
   copy .env.example .env    # then add your own GROQ_API_KEY (free at console.groq.com)
   uvicorn app.main:app --reload --port 8000
   ```
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev   # http://localhost:5173
   ```

Open `http://localhost:5173`, click **Create one** on the login page to register your own
company, and you're in — a genuinely empty workspace backed by real MySQL data, not a
pre-loaded demo.

## Running it as a Windows desktop app

Prefer a real taskbar app over a browser tab? See [`desktop/README.md`](desktop/README.md) —
an Electron shell that starts MySQL/the backend/the AI service for you and opens a native
window with the Nexora icon:

```bash
cd frontend && npm run build   # build once before packaging
cd ../desktop
npm install
npm start        # run it directly
npm run dist      # or build a real Windows installer (.exe) into desktop/release/
```

## Offline / no-setup mode (optional fallback)

Don't want to install MySQL right now? Set `VITE_USE_MOCK_BACKEND=true` in `frontend/.env`
and restart `npm run dev` — the app falls back to an in-memory mock dataset (a fictional
Indian bakery company) with any email/password signing you in. Useful for quick UI
exploration without any setup, but not how the product actually runs.

## Testing

```bash
cd frontend
npm test          # unit tests (vitest) — recommendation engine, health engine, BOM costing
npm run test:e2e  # end-to-end tests (Playwright) — needs the dev server + backend running
```

## What's implemented vs. what's next

- [`PROJECT_STATUS.md`](PROJECT_STATUS.md) — the original 19-module milestone (all frontend
  modules, real ML forecasting, AI chat integration).
- [`PROJECT_ROADMAP.md`](PROJECT_ROADMAP.md) — everything built after that: full CRUD for
  every catalog entity wired to the real backend, bulk CSV import, a real Setup Wizard +
  registration flow, a Company Settings page with live currency switching, a Vendor Portal,
  a command palette, PDF export, live Groq AI, and the real Spring Boot + MySQL backend as
  the default data source — plus what's still explicitly out of scope by choice (real
  billing/notifications integrations, which need third-party accounts only you can create).
