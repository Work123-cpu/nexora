import type { ReactNode } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { canAccess, type PermissionAction, type PermissionResource } from '@/shared/lib/permissions'

interface RoleGuardProps {
  resource: PermissionResource
  action: PermissionAction
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Hides its children when the signed-in user's role can't perform this action — the backend
 * enforces the real permission check on every write, this just keeps the UI from offering
 * buttons that would 403. Pass `fallback` to show something else instead (e.g. a disabled hint).
 */
export function RoleGuard({ resource, action, children, fallback = null }: RoleGuardProps) {
  const { session } = useAuth()
  const role = session?.role ?? 'viewer'
  const allowed = canAccess(role, resource, action)

  return <>{allowed ? children : fallback}</>
}
