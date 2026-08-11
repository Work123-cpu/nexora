/**
 * Nexora Desktop — Electron shell around the existing web app.
 *
 * This does NOT bundle a JVM/MySQL/Python into the installer (that's a much bigger
 * undertaking than an Electron shell) — those three are auto-detected on THIS machine
 * rather than assuming one developer's paths, same as before. It DOES bundle Maven plus
 * the backend/ai-service *source* as extraResources (see desktop/package.json), since
 * those are ours to ship — see the "Resource resolution" block below for how a packaged
 * app locates and runs them. On launch it spawns the same local MySQL/Spring Boot/FastAPI
 * processes documented in backend/README.md and ai-service/README.md, then opens a native
 * window pointed at the built frontend. Closing the window stops everything it started.
 *
 * First run on any machine shows setup.html: it checks for JDK/MySQL/Python/Maven,
 * lets the user create the MySQL schema with one click, and collects their own Groq
 * API key (never a key baked into the app) before continuing to the real app.
 *
 * If a service is already running (e.g. you started it yourself in a terminal),
 * this skips spawning it and just uses what's already there.
 *
 * Every launch (after first-run setup) shows splash.html — an animated logo reveal —
 * while those local services spin up in the background, with live status text pushed
 * over IPC (see sendStatus below) so the wait never looks frozen.
 *
 * Missing prerequisites: setup.html can also download and silently install Java and
 * Python directly (official Adoptium/python.org sources, per-machine/per-user installs
 * that self-elevate via Windows UAC as needed — never bundled or bypassed). MySQL is
 * deliberately NOT silently installed: its setup wizard decides the root auth method and
 * password, which the rest of the app already has assumptions about, so a human should
 * make that call — Nexora downloads the official installer and opens it for them instead.
 */
const { app, BrowserWindow, dialog, ipcMain, shell, Menu } = require('electron')
const path = require('path')
const net = require('net')
const http = require('http')
const https = require('https')
const os = require('os')
const fs = require('fs')
const { spawn, spawnSync } = require('child_process')

const STATIC_PORT = 5510
const ICON_PATH = path.join(__dirname, 'build', 'icon.png')

const USER_DATA = app.getPath('userData')
const SETUP_MARKER = path.join(USER_DATA, 'setup-complete.json')
const LOG_DIR = path.join(USER_DATA, 'logs')
const LOG_FILE = path.join(LOG_DIR, 'nexora.log')

// ---------------------------------------------------------------------------
// Resource resolution — a packaged install's "source of truth" for the bundled
// backend/ai-service/Maven is process.resourcesPath (populated by electron-builder's
// extraResources, see desktop/package.json), NOT any path math relative to the .exe.
// Maven needs to write backend/target and pip needs to create ai-service/.venv, and a
// per-machine install directory (e.g. Program Files) may not be writable by the current
// user — so the actual runtime copies of backend/ and ai-service/ live under userData
// (always writable) and are synced from the read-only bundled copy on first run / update.
// Dev mode (`npm start`) skips all of this and just runs straight out of the repo.
// ---------------------------------------------------------------------------
const RESOURCES_ROOT = app.isPackaged ? process.resourcesPath : path.join(__dirname, '..')
const FRONTEND_DIST = path.join(RESOURCES_ROOT, app.isPackaged ? 'frontend-dist' : path.join('frontend', 'dist'))
const TOOLS_DIR = path.join(RESOURCES_ROOT, app.isPackaged ? 'tools' : '.tools')
const RUNTIME_ROOT = app.isPackaged ? path.join(USER_DATA, 'runtime') : RESOURCES_ROOT
const BACKEND_DIR = path.join(RUNTIME_ROOT, 'backend')
const AI_SERVICE_DIR = path.join(RUNTIME_ROOT, 'ai-service')

/** Copies the bundled (read-only) backend/ and ai-service/ source into the writable runtime
 * location, skipped once already synced for the running app's version. cpSync only adds/
 * overwrites files present in the source — it never deletes extras — so a prior build's
 * backend/target or ai-service/.venv (never part of the bundle) survives untouched across
 * both first-run and later app updates. */
function ensureWritableRuntimeCopy() {
  if (!app.isPackaged) return
  const versionFile = path.join(RUNTIME_ROOT, '.version')
  const currentVersion = app.getVersion()
  const stampedVersion = fs.existsSync(versionFile) ? fs.readFileSync(versionFile, 'utf8').trim() : null
  if (stampedVersion === currentVersion) return

  for (const name of ['backend', 'ai-service']) {
    const src = path.join(RESOURCES_ROOT, name)
    const dest = path.join(RUNTIME_ROOT, name)
    if (!fs.existsSync(src)) continue
    log(`[setup] syncing ${name} runtime files (v${currentVersion})…`)
    fs.mkdirSync(dest, { recursive: true })
    fs.cpSync(src, dest, { recursive: true, force: true })
  }
  fs.mkdirSync(RUNTIME_ROOT, { recursive: true })
  fs.writeFileSync(versionFile, currentVersion)
}

// ---------------------------------------------------------------------------
// Logging — every service's output and every failure lands in one file so
// "what went wrong" is never just a vanished console window.
// ---------------------------------------------------------------------------
fs.mkdirSync(LOG_DIR, { recursive: true })
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' })
function log(line) {
  const stamped = `[${new Date().toISOString()}] ${line}`
  logStream.write(stamped.endsWith('\n') ? stamped : stamped + '\n')
  process.stdout.write(line.endsWith('\n') ? line : line + '\n')
}

ensureWritableRuntimeCopy()

// ---------------------------------------------------------------------------
// Prerequisite auto-detection — searches common install locations instead of
// assuming the developer's exact paths, so this works on a fresh machine.
// ---------------------------------------------------------------------------
function findFirstExisting(candidates) {
  return candidates.find((p) => p && fs.existsSync(p))
}

function globDirs(parent, prefix) {
  if (!fs.existsSync(parent)) return []
  return fs
    .readdirSync(parent)
    .filter((d) => d.toLowerCase().startsWith(prefix.toLowerCase()))
    .map((d) => path.join(parent, d))
    .sort()
    .reverse()
}

function findJavaHome() {
  if (process.env.JAVA_HOME && fs.existsSync(process.env.JAVA_HOME)) return process.env.JAVA_HOME
  const roots = ['C:\\Program Files\\Eclipse Adoptium', 'C:\\Program Files\\Java', 'C:\\Program Files\\Microsoft\\jdk-17']
  for (const root of roots) {
    const hit = findFirstExisting(globDirs(root, 'jdk'))
    if (hit) return hit
  }
  return undefined
}

function findMySql() {
  const roots = globDirs('C:\\Program Files\\MySQL', 'MySQL Server')
  for (const root of roots) {
    const mysqld = path.join(root, 'bin', 'mysqld.exe')
    const mysqlClient = path.join(root, 'bin', 'mysql.exe')
    if (fs.existsSync(mysqld)) {
      const iniCandidates = [
        path.join('C:\\ProgramData\\MySQL', path.basename(root), 'my.ini'),
        path.join(root, 'my.ini'),
      ]
      return { mysqld, mysqlClient: fs.existsSync(mysqlClient) ? mysqlClient : undefined, ini: findFirstExisting(iniCandidates) }
    }
  }
  return undefined
}

function findPython() {
  // globDirs sorts newest-version-first, which is right for Java/MySQL but wrong here: the
  // AI service's scientific packages (numpy/pandas/scikit-learn/xgboost) only get prebuilt
  // Windows wheels for a Python version some months after it ships. Picking the very newest
  // installed Python risks landing on one with no wheels yet, forcing pip to build from
  // source — which then fails without a full MSVC+Windows-SDK toolchain (e.g. a missing
  // stdalign.h). Reversed back to oldest-first here so an established version like 3.12 is
  // tried before a bleeding-edge one like 3.14, while still preferring a user-scoped install
  // (LOCALAPPDATA) over a machine-wide one (Program Files) as the outer priority.
  const candidates = [
    ...globDirs(path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python'), 'Python').reverse().map((d) => path.join(d, 'python.exe')),
    ...globDirs('C:\\Program Files', 'Python').reverse().map((d) => path.join(d, 'python.exe')),
  ]
  const found = findFirstExisting(candidates)
  if (found) return found
  // Fall back to whatever "python" resolves to on PATH, if anything.
  const result = spawnSync('where', ['python'], { encoding: 'utf8', windowsHide: true })
  if (result.status === 0) {
    const first = result.stdout.split(/\r?\n/).find((line) => line.trim())
    if (first && fs.existsSync(first.trim())) return first.trim()
  }
  return undefined
}

let JAVA_HOME = findJavaHome()
let MYSQL = findMySql()
let PYTHON_EXE = findPython()
const MAVEN_EXE = path.join(TOOLS_DIR, 'apache-maven-3.9.9', 'bin', 'mvn.cmd')
const AI_VENV_UVICORN = path.join(AI_SERVICE_DIR, '.venv', 'Scripts', 'uvicorn.exe')
const AI_ENV_FILE = path.join(AI_SERVICE_DIR, '.env')
const AI_ENV_EXAMPLE = path.join(AI_SERVICE_DIR, '.env.example')

const CONFIG = {
  mysql: {
    port: 3306,
    exe: MYSQL?.mysqld,
    args: MYSQL?.ini ? [`--defaults-file=${MYSQL.ini}`, '--console'] : ['--console'],
  },
  backend: {
    port: 8081,
    cwd: BACKEND_DIR,
    exe: MAVEN_EXE,
    args: ['spring-boot:run'],
    env: JAVA_HOME ? { JAVA_HOME } : {},
  },
  aiService: {
    port: 8000,
    cwd: AI_SERVICE_DIR,
    exe: AI_VENV_UVICORN,
    args: ['app.main:app', '--port', '8000'],
  },
}

function checkPrerequisites() {
  return [
    {
      id: 'java',
      label: 'Java 17 (for the backend)',
      ok: Boolean(JAVA_HOME),
      hint: 'Install Eclipse Temurin 17 from adoptium.net, then restart Nexora.',
    },
    {
      id: 'maven',
      label: 'Apache Maven (bundled with Nexora)',
      ok: fs.existsSync(MAVEN_EXE),
      hint: 'This ships inside the app — if missing, reinstall Nexora.',
    },
    {
      id: 'mysql',
      label: 'MySQL Server',
      ok: Boolean(MYSQL),
      hint: 'Install MySQL Community Server from dev.mysql.com, then restart Nexora.',
    },
    {
      id: 'python',
      label: 'Python AI service environment',
      ok: fs.existsSync(AI_VENV_UVICORN),
      hint: 'Run ai-service/README.md\'s one-time setup (python -m venv .venv && pip install -r requirements.txt), then restart Nexora.',
    },
  ]
}

// ---------------------------------------------------------------------------
// Service orchestration
// ---------------------------------------------------------------------------
const spawnedProcesses = []

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host: '127.0.0.1' })
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => resolve(false))
    socket.setTimeout(800, () => {
      socket.destroy()
      resolve(false)
    })
  })
}

function waitForPort(port, timeoutMs) {
  const start = Date.now()
  return new Promise((resolve) => {
    const tick = async () => {
      if (await isPortOpen(port)) return resolve(true)
      if (Date.now() - start > timeoutMs) return resolve(false)
      setTimeout(tick, 1000)
    }
    tick()
  })
}

/** Kills a process AND everything it spawned. child.kill() alone only signals the immediate
 * process — on Windows that's not enough for `mvn spring-boot:run`, which launches its own
 * child java.exe: killing just the mvn/cmd wrapper leaves that Java process (and the whole
 * backend) orphaned and running in the background after the app "closes". */
function killProcessTree(pid) {
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { windowsHide: true })
  } else {
    try {
      process.kill(-pid, 'SIGKILL')
    } catch {
      process.kill(pid, 'SIGKILL')
    }
  }
}

function stopAllServices() {
  for (const { name, child } of spawnedProcesses) {
    if (child.exitCode !== null || child.killed) continue
    log(`[${name}] stopping (pid ${child.pid}, full tree)…`)
    try {
      killProcessTree(child.pid)
    } catch (err) {
      log(`[${name}] failed to stop cleanly: ${err.message}`)
    }
  }
}

function spawnService(name, { exe, args, cwd, env }) {
  if (!exe) throw new Error(`${name} is not installed on this machine — see the setup screen for what's missing.`)
  // mvn.cmd is a batch script, not a PE executable — Windows' CreateProcess (what Node's
  // spawn() uses without `shell`) can't launch it directly and fails with EINVAL. Routing
  // it through a shell is what actually resolves and runs a .cmd/.bat file.
  const needsShell = process.platform === 'win32' && /\.(cmd|bat)$/i.test(exe)
  const child = spawn(exe, args, {
    cwd,
    env: { ...process.env, ...env },
    windowsHide: true,
    shell: needsShell,
  })
  // A spawn failure (e.g. ENOENT for a missing executable) fires this 'error' event
  // asynchronously. With no listener, Node treats it as an uncaught exception — which
  // bypasses ensureService's caller's try/catch entirely and, in the startup path, left the
  // splash window stuck on screen with no way to close it. Logging here instead turns it
  // into a normal, silent no-op; ensureService below is what actually surfaces the failure.
  child.on('error', (err) => log(`[${name}] failed to start: ${err.message}`))
  child.stdout?.on('data', (d) => log(`[${name}] ${d}`.trimEnd()))
  child.stderr?.on('data', (d) => log(`[${name}] ${d}`.trimEnd()))
  spawnedProcesses.push({ name, child })
  return child
}

async function ensureService(name, cfg) {
  if (await isPortOpen(cfg.port)) {
    log(`[${name}] already running on port ${cfg.port} — reusing it`)
    return
  }
  log(`[${name}] starting…`)
  const child = spawnService(name, cfg)
  // Races normal readiness against an early failure (bad spawn, or the process dying before
  // ever opening its port) so a broken install surfaces immediately instead of making the
  // user sit through the full 90s timeout.
  const failure = new Promise((_, reject) => {
    child.once('error', (err) => reject(new Error(`${name} failed to start: ${err.message}`)))
    child.once('exit', (code) => {
      if (code !== 0 && code !== null) reject(new Error(`${name} exited unexpectedly (code ${code}) — see View Logs in the app menu.`))
    })
  })
  const ready = await Promise.race([waitForPort(cfg.port, 90_000), failure])
  if (!ready) throw new Error(`${name} did not come up on port ${cfg.port} within 90s — see View Logs in the app menu.`)
}

/** Minimal static file server for the built SPA, with a catch-all fallback to index.html for client-side routing. */
function startStaticServer() {
  const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' }
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0])
    let filePath = path.join(FRONTEND_DIST, urlPath)
    if (!filePath.startsWith(FRONTEND_DIST)) filePath = FRONTEND_DIST
    if (urlPath === '/' || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(FRONTEND_DIST, 'index.html')
    }
    const ext = path.extname(filePath)
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] ?? 'application/octet-stream' })
    fs.createReadStream(filePath).pipe(res)
  })
  return new Promise((resolve) => server.listen(STATIC_PORT, '127.0.0.1', () => resolve(server)))
}

// ---------------------------------------------------------------------------
// Prerequisite installers — download from official sources only, verified HTTPS.
// ---------------------------------------------------------------------------
const DOWNLOAD_DIR = path.join(os.tmpdir(), 'nexora-prereqs')
const PYTHON_INSTALLER_URL = 'https://www.python.org/ftp/python/3.12.7/python-3.12.7-amd64.exe'
const MYSQL_INSTALLER_URL = 'https://dev.mysql.com/get/Downloads/MySQLInstaller/mysql-installer-web-community-8.0.40.0.msi'
const ADOPTIUM_ASSETS_API = 'https://api.adoptium.net/v3/assets/latest/17/hotspot?image_type=jdk&os=windows&architecture=x64&vendor=eclipse'

function checkInternet() {
  return new Promise((resolve) => {
    const req = https.get('https://api.adoptium.net/v3/info/available_releases', { timeout: 6000 }, (res) => {
      res.resume()
      resolve(res.statusCode >= 200 && res.statusCode < 400)
    })
    req.on('error', () => resolve(false))
    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })
  })
}

/** GETs a URL following up to 5 redirects, resolving with the parsed JSON body. */
function httpsGetJson(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Nexora-Desktop' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirectsLeft > 0) {
          res.resume()
          resolve(httpsGetJson(res.headers.location, redirectsLeft - 1))
          return
        }
        if (res.statusCode !== 200) {
          res.resume()
          reject(new Error(`HTTP ${res.statusCode} fetching ${url}`))
          return
        }
        let body = ''
        res.on('data', (chunk) => (body += chunk))
        res.on('end', () => {
          try {
            resolve(JSON.parse(body))
          } catch (err) {
            reject(err)
          }
        })
      })
      .on('error', reject)
  })
}

/** Downloads a URL to disk, following redirects, reporting 0-100 progress. */
function downloadFile(url, destPath, onProgress, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Nexora-Desktop' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirectsLeft > 0) {
          res.resume()
          resolve(downloadFile(res.headers.location, destPath, onProgress, redirectsLeft - 1))
          return
        }
        if (res.statusCode !== 200) {
          res.resume()
          reject(new Error(`HTTP ${res.statusCode} downloading ${url}`))
          return
        }
        const total = Number(res.headers['content-length'] || 0)
        let downloaded = 0
        fs.mkdirSync(path.dirname(destPath), { recursive: true })
        const file = fs.createWriteStream(destPath)
        res.on('data', (chunk) => {
          downloaded += chunk.length
          if (total > 0) onProgress?.(Math.round((downloaded / total) * 100))
        })
        res.pipe(file)
        file.on('finish', () => file.close(() => resolve(destPath)))
        file.on('error', reject)
      })
      .on('error', reject)
  })
}

/** Runs a command asynchronously and resolves with its exit status — never spawnSync here.
 * pip installing the AI service's dependencies (numpy/pandas/scikit-learn/xgboost, several
 * hundred MB) can take minutes, and spawnSync blocks Node's single main thread for the whole
 * duration: the entire app — not just this install — stops responding to any input, redraw,
 * or IPC, and Windows reports it as "Not Responding". onLine (optional) receives each output
 * line as it streams, so slow steps can show real, moving progress instead of a static
 * message that's indistinguishable from a hang. */
function runCommand(exe, args, { cwd, onLine } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, { cwd, windowsHide: true })
    let stdout = ''
    let stderr = ''
    const feed = (chunk, into) => {
      const text = chunk.toString()
      into.text += text
      if (onLine) for (const line of text.split(/\r?\n/)) if (line.trim()) onLine(line.trim())
    }
    const out = { text: '' }
    const err = { text: '' }
    child.stdout?.on('data', (d) => feed(d, out))
    child.stderr?.on('data', (d) => feed(d, err))
    child.on('error', reject)
    child.on('close', (status) => {
      stdout = out.text
      stderr = err.text
      resolve({ status, stdout, stderr })
    })
  })
}

async function installJavaSilently(onProgress) {
  onProgress('Looking up the latest Java 17 build…')
  const assets = await httpsGetJson(ADOPTIUM_ASSETS_API)
  const installerUrl = assets?.[0]?.binary?.installer?.link
  if (!installerUrl) throw new Error('Could not find a Java 17 installer for this machine right now.')

  const msiPath = path.join(DOWNLOAD_DIR, 'temurin-jdk17.msi')
  onProgress('Downloading Java 17 (Eclipse Temurin)…')
  await downloadFile(installerUrl, msiPath, (pct) => onProgress(`Downloading Java 17… ${pct}%`))

  onProgress('Installing Java 17 (you may see a Windows permission prompt)…')
  const result = await runCommand('msiexec.exe', ['/i', msiPath, '/quiet', '/norestart', 'ADDLOCAL=FeatureMain,FeatureEnvironment,FeatureJarFileRunWith,FeatureJavaHome'])
  if (result.status !== 0) throw new Error(`Java installer exited with code ${result.status}.`)
  onProgress('Java 17 installed.')
}

async function installPythonSilently(onProgress) {
  const exePath = path.join(DOWNLOAD_DIR, 'python-installer.exe')
  onProgress('Downloading Python…')
  await downloadFile(PYTHON_INSTALLER_URL, exePath, (pct) => onProgress(`Downloading Python… ${pct}%`))

  // Per-user install (InstallAllUsers=0) — no admin/UAC prompt needed, and this app only
  // ever needs Python for its own bundled ai-service venv, not a system-wide install.
  onProgress('Installing Python…')
  const result = await runCommand(exePath, ['/quiet', 'InstallAllUsers=0', 'PrependPath=1', 'Include_test=0'])
  if (result.status !== 0) throw new Error(`Python installer exited with code ${result.status}.`)
  onProgress('Python installed.')
}

/** Creates ai-service/.venv and installs requirements.txt — safe to re-run; used both right
 * after a fresh Python install and for someone who already had Python but never ran this. */
async function bootstrapAiEnvironment(onProgress) {
  const pythonExe = findPython()
  if (!pythonExe) throw new Error('Python still was not found after installing — try restarting Nexora.')

  const aiServiceDir = AI_SERVICE_DIR
  const venvDir = path.join(aiServiceDir, '.venv')

  if (!fs.existsSync(venvDir)) {
    onProgress('Creating the AI service\'s Python environment…')
    const venvResult = await runCommand(pythonExe, ['-m', 'venv', '.venv'], { cwd: aiServiceDir })
    if (venvResult.status !== 0) throw new Error(`Could not create the Python virtual environment (exit ${venvResult.status}).`)
  }

  onProgress('Installing AI service dependencies — this can take a few minutes…')
  const pipExe = path.join(venvDir, 'Scripts', 'pip.exe')
  const pipResult = await runCommand(pipExe, ['install', '-r', 'requirements.txt'], {
    cwd: aiServiceDir,
    // pip prints a line per package as it works ("Collecting numpy", "Downloading pandas...",
    // "Installing collected packages: ...") — surfacing those turns several minutes of an
    // otherwise-static message into visibly moving progress.
    onLine: (line) => {
      if (/^(Collecting|Downloading|Installing|Building)\s/.test(line)) {
        onProgress(`Installing AI service dependencies — ${line}`)
      }
    },
  })
  if (pipResult.status !== 0) {
    log(`[setup] pip install failed: ${pipResult.stderr}`)
    // Delete the partial venv rather than leaving it behind: the "if (!fs.existsSync(venvDir))"
    // check above would otherwise see it on the next attempt and skip straight to reusing it —
    // including whichever Python interpreter it was created with, even after findPython()'s
    // own preference changes (e.g. after this exact bug's fix). A retry should start clean.
    fs.rmSync(venvDir, { recursive: true, force: true })
    throw new Error('Installing AI service dependencies failed — see View Error Log.')
  }
  onProgress('AI service environment ready.')
}

async function downloadAndOpenMysqlInstaller(onProgress) {
  const msiPath = path.join(DOWNLOAD_DIR, 'mysql-installer-web-community.msi')
  onProgress('Downloading the official MySQL installer…')
  await downloadFile(MYSQL_INSTALLER_URL, msiPath, (pct) => onProgress(`Downloading MySQL installer… ${pct}%`))
  onProgress('Opening the MySQL installer — finish its setup wizard, then come back here and click "Check again".')
  await shell.openPath(msiPath)
}

// ---------------------------------------------------------------------------
// IPC handlers for setup.html
// ---------------------------------------------------------------------------
ipcMain.handle('nexora:check-prerequisites', () => checkPrerequisites())
ipcMain.handle('nexora:check-internet', () => checkInternet())

ipcMain.handle('nexora:install-prereq', async (event, id) => {
  const sendProgress = (message) => event.sender.send('nexora:install-progress', { id, message })
  try {
    if (id === 'java') await installJavaSilently(sendProgress)
    else if (id === 'python') {
      if (!findPython()) await installPythonSilently(sendProgress)
      else sendProgress('Python is already installed — setting up the AI service environment…')
      await bootstrapAiEnvironment(sendProgress)
    } else if (id === 'mysql') await downloadAndOpenMysqlInstaller(sendProgress)
    else throw new Error(`Unknown prerequisite: ${id}`)
    return { ok: true }
  } catch (err) {
    log(`[setup] install-prereq(${id}) failed: ${err.stack ?? err}`)
    return { ok: false, message: err.message ?? String(err) }
  }
})

/** For someone who already has Python but never ran the AI service's one-time setup. */
ipcMain.handle('nexora:bootstrap-ai-env', async (event) => {
  const sendProgress = (message) => event.sender.send('nexora:install-progress', { id: 'python', message })
  try {
    await bootstrapAiEnvironment(sendProgress)
    return { ok: true }
  } catch (err) {
    log(`[setup] bootstrap-ai-env failed: ${err.stack ?? err}`)
    return { ok: false, message: err.message ?? String(err) }
  }
})

ipcMain.handle('nexora:setup-database', async () => {
  if (!MYSQL) return { ok: false, message: 'MySQL was not found on this machine — install it first.' }

  const wasRunning = await isPortOpen(3306)
  if (!wasRunning) {
    log('[setup] starting MySQL temporarily to create the schema…')
    spawnService('mysql', CONFIG.mysql)
    const ready = await waitForPort(3306, 30_000)
    if (!ready) return { ok: false, message: 'Could not start MySQL to set up the schema. See View Logs.' }
  }

  const sql = [
    "CREATE DATABASE IF NOT EXISTS nexora CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
    "CREATE USER IF NOT EXISTS 'nexora_app'@'localhost' IDENTIFIED BY 'nexora_dev_pw';",
    "GRANT ALL PRIVILEGES ON nexora.* TO 'nexora_app'@'localhost';",
    "FLUSH PRIVILEGES;",
  ].join(' ')

  if (!MYSQL.mysqlClient) {
    return { ok: false, message: 'MySQL is running but the mysql.exe client was not found alongside it — create the schema manually (see backend/README.md).' }
  }

  const result = spawnSync(MYSQL.mysqlClient, ['-u', 'root', '-e', sql], { encoding: 'utf8', timeout: 15_000 })
  if (result.status === 0) {
    log('[setup] database schema created/confirmed successfully')
    return { ok: true, message: 'Database and app user are ready.' }
  }

  // A fresh MySQL install sometimes has a non-empty root password we don't know — that's
  // expected here, not a bug we can silently work around. Tell the user exactly what to do.
  log(`[setup] database setup failed: ${result.stderr}`)
  return {
    ok: false,
    message: 'Could not connect as root (it may have a password). Run the CREATE DATABASE commands from backend/README.md manually with your root password.',
  }
})

ipcMain.handle('nexora:save-groq-key', (_event, key) => {
  try {
    let contents = fs.existsSync(AI_ENV_FILE)
      ? fs.readFileSync(AI_ENV_FILE, 'utf8')
      : fs.existsSync(AI_ENV_EXAMPLE)
        ? fs.readFileSync(AI_ENV_EXAMPLE, 'utf8')
        : 'GROQ_API_KEY=\nGROQ_MODEL=llama-3.3-70b-versatile\nALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5510,http://localhost:5510\nHOST=0.0.0.0\nPORT=8000\nLOG_LEVEL=INFO\n'

    contents = contents.includes('GROQ_API_KEY=')
      ? contents.replace(/GROQ_API_KEY=.*/g, `GROQ_API_KEY=${key}`)
      : contents + `\nGROQ_API_KEY=${key}\n`

    fs.writeFileSync(AI_ENV_FILE, contents, 'utf8')
    log('[setup] Groq API key saved to ai-service/.env')
    return { ok: true, message: 'Saved.' }
  } catch (err) {
    log(`[setup] failed to save Groq key: ${err.message}`)
    return { ok: false, message: `Could not write ai-service/.env: ${err.message}` }
  }
})

ipcMain.handle('nexora:open-external', (_event, url) => shell.openExternal(url))

let resolveSetupComplete
const setupCompletePromise = new Promise((resolve) => {
  resolveSetupComplete = resolve
})
ipcMain.handle('nexora:complete-setup', () => {
  fs.writeFileSync(SETUP_MARKER, JSON.stringify({ completedAt: new Date().toISOString() }))
  resolveSetupComplete()
  return { ok: true }
})

// Used by Settings after changing the Groq key — the AI service only reads ai-service/.env
// at process startup, so a full relaunch (not just a page reload) is what actually applies it.
ipcMain.handle('nexora:relaunch', () => {
  log('[settings] relaunching to apply changed settings…')
  app.relaunch()
  app.exit(0)
})

// frame:false strips the native minimize button along with the rest of the titlebar, so
// splash.html has its own minimize control that calls this instead.
ipcMain.handle('nexora:splash-minimize', () => {
  if (currentSplash && !currentSplash.isDestroyed()) currentSplash.minimize()
})

// ---------------------------------------------------------------------------
// Window + app lifecycle
// ---------------------------------------------------------------------------
// Tracked at module scope (not just inside createWindow) so the global uncaughtException
// handler below can also close it — a defense-in-depth backstop against any startup failure
// mode that isn't already caught by createWindow's own try/catch, so the frameless splash
// can never again get stuck on screen with no way to close it.
let currentSplash = null

/** Small frameless, transparent, rounded-corner window for the animated logo reveal — a
 * separate window (not the main one) so the rounded corners can actually show the desktop
 * through them, and so it can be closed outright once the real app is ready.
 *
 * Deliberately NOT alwaysOnTop and NOT skipTaskbar: startup (first MySQL/backend/AI-service
 * boot especially) can take well over a minute, and a topmost, taskbar-less window would sit
 * on top of and block whatever else the user is doing for that whole time with no way to get
 * it out of the way. It behaves like a normal (if unusually shaped) window — has a taskbar
 * entry, can be alt-tabbed to, and gets a real minimize button since frame:false removes the
 * native one (see the button wired up in splash.html via nexora:splash-minimize below). */
function createSplashWindow() {
  const splash = new BrowserWindow({
    width: 640,
    height: 440,
    frame: false,
    resizable: false,
    movable: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    icon: ICON_PATH,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  })
  splash.center()
  return splash
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    icon: ICON_PATH,
    title: 'Nexora',
    backgroundColor: '#14090a',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  })

  win.webContents.on('render-process-gone', (_event, details) => {
    log(`[renderer] crashed: ${JSON.stringify(details)}`)
    dialog.showErrorBox('Nexora ran into a problem', `The app window crashed (${details.reason}). See View Logs in the menu for details.`)
  })

  // Not just "no setup marker": the AI service's .venv now lives in a synced runtime copy
  // (see ensureWritableRuntimeCopy above) that's fresh on first install AND on every version
  // bump, so a marker left over from a previous install/version can be stale even though the
  // .venv this exact copy needs was never bootstrapped — show setup again in that case too,
  // rather than let ensureService fail with a raw ENOENT dialog for something the setup
  // screen exists specifically to fix.
  const isFirstRun = !fs.existsSync(SETUP_MARKER) || (Boolean(PYTHON_EXE) && !fs.existsSync(AI_VENV_UVICORN))
  if (isFirstRun) {
    log('[setup] first run (or AI service environment not yet set up) — showing setup screen')
    win.show()
    try {
      await win.loadFile(path.join(__dirname, 'setup.html'))
    } catch (err) {
      log(`[setup] failed to load setup.html: ${err.message ?? err}`)
      throw err
    }
    log('[setup] setup.html loaded, waiting for user to complete setup…')
    await setupCompletePromise
    log('[setup] setup complete, continuing to normal startup')
    win.hide()
  }

  const splash = createSplashWindow()
  currentSplash = splash
  await splash.loadFile(path.join(__dirname, 'splash.html'))
  splash.show()
  const sendStatus = (text) => {
    if (!splash.isDestroyed()) splash.webContents.send('nexora:status', text)
  }
  // The logo-reveal animation runs on its own fixed ~2.6s timeline regardless of how long
  // startup actually takes — when every service is already running this whole block can
  // resolve in well under a second, and without this floor the splash would flash by before
  // the reveal even finishes playing.
  const splashMinDuration = new Promise((resolve) => setTimeout(resolve, 2600))

  try {
    sendStatus('Starting database…')
    await ensureService('mysql', CONFIG.mysql)
    sendStatus('Starting backend…')
    await ensureService('backend', CONFIG.backend)
    sendStatus('Starting AI service…')
    // Unlike mysql/backend (without which nothing works), the AI service only backs the AI
    // chat/recommendations feature — the rest of Nexora (inventory, procurement, etc.) has no
    // dependency on it. So its failure is logged and shown to the user, but doesn't block the
    // rest of the app from launching; the frontend already handles AI endpoints being
    // unavailable (e.g. no Groq key configured) the same way it'd handle this.
    try {
      await ensureService('ai-service', CONFIG.aiService)
    } catch (err) {
      log(`[startup] AI service did not start (non-fatal, continuing without it): ${err.message ?? err}`)
    }
    sendStatus('Almost there…')
    await startStaticServer()
    await splashMinDuration

    await win.loadURL(`http://127.0.0.1:${STATIC_PORT}`)
    win.show()
    if (!splash.isDestroyed()) splash.close()
    currentSplash = null
  } catch (err) {
    log(`[startup] FAILED: ${err.message ?? err}`)
    if (!splash.isDestroyed()) splash.close()
    currentSplash = null
    win.show()
    dialog.showErrorBox('Nexora failed to start', `${String(err.message ?? err)}\n\nFull log: ${LOG_FILE}`)
    app.quit()
  }
}

function buildMenu() {
  const template = [
    {
      label: 'Nexora',
      submenu: [
        {
          label: 'View Error Log',
          click: () => shell.openPath(LOG_FILE),
        },
        {
          label: 'Re-run First-Time Setup',
          click: () => {
            if (fs.existsSync(SETUP_MARKER)) fs.unlinkSync(SETUP_MARKER)
            app.relaunch()
            app.exit(0)
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function safeCreateWindow() {
  createWindow().catch((err) => {
    log(`[main] createWindow failed: ${err.stack ?? err}`)
    dialog.showErrorBox('Nexora failed to start', `${String(err.message ?? err)}\n\nFull log: ${LOG_FILE}`)
    app.quit()
  })
}

app.whenReady().then(() => {
  buildMenu()
  safeCreateWindow()
})

app.on('window-all-closed', () => {
  stopAllServices()
  if (process.platform !== 'darwin') app.quit()
})

// Safety net: covers app.quit() being called directly (e.g. the startup-failure path)
// without window-all-closed necessarily firing first.
app.on('before-quit', stopAllServices)

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) safeCreateWindow()
})

process.on('uncaughtException', (err) => {
  log(`[main] uncaught exception: ${err.stack ?? err}`)
  if (currentSplash && !currentSplash.isDestroyed()) {
    currentSplash.close()
    currentSplash = null
  }
  dialog.showErrorBox('Nexora hit an unexpected error', `${err.message}\n\nFull log: ${LOG_FILE}`)
})

process.on('unhandledRejection', (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason))
  log(`[main] unhandled rejection: ${err.stack ?? err}`)
})
