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

/** Flip to "false" once the Spring Boot backend (backend/) is running to authenticate for real. */
const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false'

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

function buildMockSession(email: string, name?: string, companyName?: string): AuthSession {
  const derivedName = name || email.split('@')[0]!.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return {
    role: 'admin',
    user: {
      id: 'user-0001',
      name: derivedName || 'Aditya Kapoor',
      email,
      role: 'admin',
      jobTitle: 'Procurement Director',
      companyName: companyName || 'Annapurna Foods & Beverages Pvt. Ltd.',
      createdAt: new Date().toISOString(),
    },
  }
}

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
    if (USE_MOCK_BACKEND) {
      await new Promise((resolve) => setTimeout(resolve, 600))
      const next = buildMockSession(email)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setSession(next)
      return
    }

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
    if (USE_MOCK_BACKEND) {
      await new Promise((resolve) => setTimeout(resolve, 600))
      const next = buildMockSession(email, name, companyName)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      window.sessionStorage.setItem(JUST_REGISTERED_KEY, '1')
      setSession(next)
      return
    }

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
    if (USE_MOCK_BACKEND) return
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
