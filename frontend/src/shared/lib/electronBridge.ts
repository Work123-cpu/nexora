/**
 * Typed access to the `window.nexoraSetup` bridge that desktop/preload.js injects. Only
 * present when running inside the Electron desktop app (undefined in a plain browser tab) —
 * every call site must check `isDesktopApp()` first since a hosted web build has no
 * filesystem access to write ai-service/.env.
 */
export interface DesktopBridge {
  checkPrerequisites: () => Promise<{ id: string; label: string; ok: boolean; hint: string }[]>
  checkInternet: () => Promise<boolean>
  installPrereq: (id: 'java' | 'python' | 'mysql') => Promise<{ ok: boolean; message?: string }>
  bootstrapAiEnv: () => Promise<{ ok: boolean; message?: string }>
  onInstallProgress: (callback: (data: { id: string; message: string }) => void) => void
  setupDatabase: () => Promise<{ ok: boolean; message: string }>
  saveGroqKey: (key: string) => Promise<{ ok: boolean; message: string }>
  completeSetup: () => Promise<{ ok: boolean }>
  openExternal: (url: string) => Promise<void>
  relaunch: () => Promise<void>
}

declare global {
  interface Window {
    nexoraSetup?: DesktopBridge
  }
}

export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.nexoraSetup)
}

export function getDesktopBridge(): DesktopBridge | undefined {
  return typeof window !== 'undefined' ? window.nexoraSetup : undefined
}
