const { contextBridge, ipcRenderer } = require('electron')

// Renderer-facing bridge, available to both the first-run setup screen (setup.html) and the
// real app (the built React SPA) — it's the same window's preload throughout, so the app's
// own Settings page can also call saveGroqKey/relaunch to let a key be changed after setup,
// not just during it.
contextBridge.exposeInMainWorld('nexoraSetup', {
  checkPrerequisites: () => ipcRenderer.invoke('nexora:check-prerequisites'),
  setupDatabase: () => ipcRenderer.invoke('nexora:setup-database'),
  saveGroqKey: (key) => ipcRenderer.invoke('nexora:save-groq-key', key),
  completeSetup: () => ipcRenderer.invoke('nexora:complete-setup'),
  openExternal: (url) => ipcRenderer.invoke('nexora:open-external', url),
  relaunch: () => ipcRenderer.invoke('nexora:relaunch'),
})

// Renderer-facing bridge for splash.html — one-way status text pushed from main.js as each
// local service (MySQL/backend/AI service) comes up during startup.
contextBridge.exposeInMainWorld('nexoraSplash', {
  onStatus: (callback) => ipcRenderer.on('nexora:status', (_event, text) => callback(text)),
})
