# Running Nexora against a teammate's database (frontend-only setup)

This is for a teammate who wants to run and use the app **without** installing
Java, MySQL, or Python — you only need Node.js. The person hosting the data
runs the full backend on their own machine and shares two temporary URLs with
you each session; your frontend talks to those instead of `localhost`.

## One-time setup

1. **Install Node.js** (v18 or later) if you don't have it: https://nodejs.org
2. **Clone the repo** (you need to have accepted the GitHub collaborator invite first):
   ```bash
   git clone https://github.com/Work123-cpu/nexora.git
   cd nexora/frontend
   npm install
   ```
3. **Create your own `.env` file** in `frontend/` (copy `frontend/.env.example` if one
   exists, or just create a new file named `.env`) — leave it mostly empty for now,
   you'll fill in the values each session (see below).

## Every time you want to collaborate

1. The teammate hosting the data runs `run-nexora-collab.cmd` on their machine and
   sends you two URLs that look like:
   ```
   VITE_API_BASE_URL=https://some-random-words.trycloudflare.com/api
   VITE_AI_SERVICE_URL=https://other-random-words.trycloudflare.com
   VITE_USE_MOCK_AI=false
   VITE_USE_MOCK_FORECAST=false
   ```
2. Open `frontend/.env` in your own copy of the repo and paste those four lines in,
   replacing whatever was there before.
3. Start the frontend:
   ```bash
   cd nexora/frontend
   npm run dev
   ```
4. Open **http://localhost:5173** in your browser — you're now looking at the same
   live data as your teammate, in real time.

**Important:** those URLs are randomly generated and change every time your teammate
re-runs the script (e.g. after restarting their computer, or the next day). If the
app suddenly stops loading data, ask them to re-run the script and send you fresh
URLs, then repeat steps 2–3.

## What you can and can't do in this mode

- You **can** fully use the app — browse, add products/vendors/orders, everything —
  and it writes to the real shared database.
- You **can't** run or test backend/AI-service code changes yourself this way, since
  those are running on your teammate's machine. If you need to work on backend code,
  you'll need your own local MySQL + Java + Python setup (see the main `README` /
  `run-nexora.cmd` for that) — you'd then be working against your own separate local
  data instead of the shared one.
- Pushing/pulling **frontend code changes** via git works completely normally —
  this setup only affects where the app gets its *data* from, not how you edit code.
