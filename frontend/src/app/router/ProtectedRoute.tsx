import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'

/**
 * Route-level guard. AppShellLayout already redirects unauthenticated users,
 * so this exists as an explicit, reusable seam for any route added outside
 * that layout later — kept intentionally simple until real session/token
 * validation exists.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}
