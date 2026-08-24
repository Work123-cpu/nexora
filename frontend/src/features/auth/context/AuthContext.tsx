import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Role } from '@/shared/lib/permissions'
import type { User } from '@/types/entities/user'
import { apiClient, setAuthToken, UNAUTHORIZED_EVENT } from '@/shared/lib/apiClient'

const STORAGE_KEY = 'Nexora.session'
const JUST_REGISTERED_KEY = 'Nexora.just-registered'

/** True right after a successful registration. Read-only (safe to call during render, incl. React StrictMode's double-render) — pair with clearJustRegistered() in an effect. */
export function peekJustRegistered(): boolean {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem(JUST_REGISTERED_KEY) === '1'
}

export function clearJustRegistered(): void {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(JUST_REGISTERED_KEY)
}

interface BackendAuthResponse {
  token: string
  userId: string
  companyId: string
  name: string
  email: string
  role: string
}

export interface AuthSession {
  user: User
  role: Role
}

interface AuthContextValue {
  session: AuthSession | null
  isAuthenticated: boolean
  login: (email: string, _password: string) => Promise<void>
  register: (companyName: string, name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (patch: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthSession) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession())

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.post<BackendAuthResponse>('/auth/login', { email, password })
    setAuthToken(res.token)
    const role = res.role.toLowerCase() as Role
    const next: AuthSession = {
      role,
      user: {
        id: res.userId,
        name: res.name,
        email: res.email,
        role,
        jobTitle: 'Team Member',
        companyName: '',
        createdAt: new Date().toISOString(),
      },
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSession(next)
  }, [])

  const register = useCallback(async (companyName: string, name: string, email: string, password: string) => {
    const res = await apiClient.post<BackendAuthResponse>('/auth/register', { companyName, name, email, password })
    setAuthToken(res.token)
    const role = res.role.toLowerCase() as Role
    const next: AuthSession = {
      role,
      user: {
        id: res.userId,
        name: res.name,
        email: res.email,
        role,
        jobTitle: 'Team Member',
        companyName,
        createdAt: new Date().toISOString(),
      },
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    window.sessionStorage.setItem(JUST_REGISTERED_KEY, '1')
    setSession(next)
  }, [])

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY)
    setAuthToken(null)
    setSession(null)
  }, [])

  // An expired/invalid JWT surfaces as a 401 on any real-backend request — clear the
  // stale session so ProtectedRoute/AppShellLayout redirect to /login instead of the
  // app silently failing on every subsequent call.
  useEffect(() => {
    const handleUnauthorized = () => logout()
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [logout])

  const updateUser = useCallback((patch: Partial<User>) => {
    setSession((prev) => {
      if (!prev) return prev
      const next = { ...prev, user: { ...prev.user, ...patch } }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ session, isAuthenticated: session !== null, login, register, logout, updateUser }),
    [session, login, register, logout, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
