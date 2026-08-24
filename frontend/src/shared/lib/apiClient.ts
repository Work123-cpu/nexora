/**
 * Typed REST client for the Spring Boot backend (`backend/`). Attaches the JWT from
 * `Nexora.auth-token` (set by AuthContext on real login) to every request, so any
 * feature's `*.service.ts` swaps its mock body for `apiClient` calls without also
 * having to handle auth itself.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const TOKEN_STORAGE_KEY = 'Nexora.auth-token'

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export class HttpError extends Error {
  status: number
  body?: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.body = body
  }
}

interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
}

function buildQuery(params?: RequestOptions['params']): string {
  if (!params) return ''
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

/** Fired on any 401 so AuthContext can clear the stale session and bounce to /login. */
export const UNAUTHORIZED_EVENT = 'nexora:unauthorized'

function extractDetail(body: unknown): string | undefined {
  return body && typeof body === 'object' && 'detail' in body ? String((body as { detail: unknown }).detail) : undefined
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = undefined
    }
    if (response.status === 401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    // GlobalExceptionHandler (backend) sends the real error text in `detail` — fall back to the
    // generic HTTP reason phrase only when a response has no such body (e.g. a network-level error).
    throw new HttpError(response.status, extractDetail(body) ?? response.statusText, body)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions): Promise<T> =>
    fetch(`${BASE_URL}${path}${buildQuery(options?.params)}`, { headers: authHeaders(), signal: options?.signal }).then(handle<T>),

  post: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
      signal: options?.signal,
    }).then(handle<T>),

  put: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
      signal: options?.signal,
    }).then(handle<T>),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
      signal: options?.signal,
    }).then(handle<T>),

  delete: <T>(path: string, options?: RequestOptions): Promise<T> =>
    fetch(`${BASE_URL}${path}${buildQuery(options?.params)}`, { method: 'DELETE', headers: authHeaders(), signal: options?.signal }).then(handle<T>),
}

export function setAuthToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token)
  else localStorage.removeItem(TOKEN_STORAGE_KEY)
}
