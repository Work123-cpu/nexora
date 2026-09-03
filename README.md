# Nexora — AI-Powered Smart Procurement & Inventory Management Platform

An enterprise-grade procurement, inventory, and supply-chain intelligence platform, running
on a real backend — not a demo. See [`docs/PROJECT_MASTER_PROMPT.md`](docs/PROJECT_MASTER_PROMPT.md)
and [`docs/01_PROJECT_VISION.md`](docs/01_PROJECT_VISION.md) for the governing spec.

This repository has three pieces:

```
frontend/     React 19 + TypeScript + Vite — the full application UI
ai-service/   FastAPI + Groq + scikit-learn/XGBoost — AI chat + real demand forecasting
backend/      Spring Boot + MySQL — real persistence, JWT auth, multi-tenant data isolation
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

## Testing

```bash
cd frontend
npm test          # unit tests (vitest) — recommendation engine, health engine, BOM costing
npm run test:e2e  # end-to-end tests (Playwright) — needs the dev server + backend running
```

## Quick-start scripts

Instead of running each piece manually, from the repo root:

- `run-nexora.cmd` — starts backend + AI service + frontend locally in one go.
- `run-nexora-demo.cmd` — additionally tunnels the running app so someone off your network
  can open a link and use it live, no setup on their end.
- `run-nexora-collab.cmd` — tunnels just your backend + AI service so a teammate can run
  their own frontend against your live data (see [`docs/FRIEND_SETUP.md`](docs/FRIEND_SETUP.md)).
