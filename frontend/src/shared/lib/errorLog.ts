const STORAGE_KEY = 'Nexora.error-log'
const MAX_ENTRIES = 50

export interface ErrorLogEntry {
  id: string
  message: string
  detail?: string
  source: 'error' | 'unhandledrejection' | 'api'
  timestamp: string
}

export function readErrorLog(): ErrorLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ErrorLogEntry[]) : []
  } catch {
    return []
  }
}

export function appendErrorLog(entry: Omit<ErrorLogEntry, 'id' | 'timestamp'>): ErrorLogEntry {
  const full: ErrorLogEntry = { ...entry, id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timestamp: new Date().toISOString() }
  const next = [full, ...readErrorLog()].slice(0, MAX_ENTRIES)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // localStorage full/unavailable — the toast still fired, which is the important part.
  }
  return full
}

export function clearErrorLog(): void {
  localStorage.removeItem(STORAGE_KEY)
}
