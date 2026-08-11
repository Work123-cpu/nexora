# Nexora Desktop (Windows)

A thin Electron shell around the existing web app — a real taskbar app with the
Nexora icon, instead of a browser tab. It does **not** bundle MySQL/the JVM/Python
into the installer (that's a much bigger project); instead, on launch it starts the
same local MySQL + Spring Boot + FastAPI processes documented in
[`backend/README.md`](../backend/README.md) and
[`ai-service/README.md`](../ai-service/README.md), auto-detecting where they're
installed on **this machine** — then opens a window pointed at the built frontend.

If a service is already running (you started it yourself in a terminal), the launcher
detects that and reuses it instead of starting a second copy.

## Prerequisites (per machine)

Auto-detected at launch — nothing to hardcode:

- **Java 17** — searched under `Program Files\Eclipse Adoptium`, `Program Files\Java`,
  `Program Files\Microsoft\jdk-17`, or `JAVA_HOME` if set.
- **MySQL Server** — searched under `Program Files\MySQL\MySQL Server *`.
- **Apache Maven** — bundled inside the repo (`.tools/apache-maven-3.9.9`), nothing to install.
- **Python AI service environment** — `ai-service/.venv` must already exist (run
  `ai-service/README.md`'s one-time `python -m venv .venv && pip install -r requirements.txt`
  before first launch — this one step isn't automated yet).

Build the frontend at least once before running the desktop app (it serves the
static `frontend/dist` output, not the Vite dev server):

```bash
cd ../frontend
npm run build
```

## First-run setup screen

The very first time Nexora runs on a machine, it shows a one-time setup screen
instead of jumping straight to the app:

- **Prerequisite check** — shows which of the above are detected, with install
  hints for anything missing.
- **Database setup** — one click runs `CREATE DATABASE IF NOT EXISTS nexora`,
  creates the `nexora_app` user, and grants it access. Safe to click even if the
  schema already exists (idempotent). If your MySQL root user has a password set,
  this will fail with a clear message — run the same SQL manually with your
  password instead (see [`backend/README.md`](../backend/README.md)).
- **Your own Groq API key** — get a free one at
  [console.groq.com](https://console.groq.com) and paste it in. This is written to
  `ai-service/.env` on **your** machine — nothing is baked into the app, and no key
  of ours ships with it. You can skip this; AI chat/recommendations just show as
  unavailable until you add one later (everything else works normally).

This only shows once. To see it again (e.g. after changing machines or moving the
repo), use the app menu → **Nexora → Re-run First-Time Setup**.

## Error log

App menu → **Nexora → View Error Log** opens a persistent log file
(`%APPDATA%/Nexora/logs/nexora.log`) containing every spawned service's
stdout/stderr plus any renderer crash or startup failure — the first place to look
if something goes wrong. Startup failures also show a native error dialog pointing
at this file.

## Run it (development)

```bash
cd desktop
npm install
npm start
```

First launch takes up to a minute while MySQL/the backend/the AI service spin up —
you'll see a brief "Starting Nexora…" screen. Subsequent launches are faster since
MySQL and the backend generally stay warm between runs if you don't fully shut them
down.

## Build a Windows installer

```bash
npm run dist
```

Produces an NSIS installer under `desktop/release/` with a real Nexora icon and
desktop shortcut. The installer only packages the Electron shell plus the built
frontend — MySQL, the JDK, and the AI service's Python environment must already be
installed on the machine that runs it (the first-run setup screen tells you exactly
what's missing).

For a quick unpacked build without the installer step (`desktop/release/win-unpacked/Nexora.exe`),
use `npm run dist:dir` instead — faster, and avoids needing network access for
electron-builder's code-signing tools.

## Closing the app

Closing the window stops every process this launcher started (MySQL, backend,
AI service). If you started any of them yourself in a separate terminal before
launching the app, those are left running — only processes the launcher itself
spawned are stopped.
