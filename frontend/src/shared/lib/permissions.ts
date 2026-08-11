/**
 * Mirrors the backend's real @PreAuthorize rules (uniform across resources today: create/edit
 * requires Admin/Procurement/Warehouse/Production Manager, delete requires Admin, PO approval
 * requires Admin/Procurement Manager). Used to hide actions the signed-in role can't perform —
 * the backend still enforces this independently on every write, this is UI-only.
 */

export type Role = 'admin' | 'procurement_manager' | 'warehouse_manager' | 'production_manager' | 'vendor' | 'viewer'

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve'

export type PermissionResource =
  | 'products'
  | 'raw-materials'
  | 'bom'
  | 'inventory'
  | 'warehouses'
  | 'purchase-orders'
  | 'billing'
  | 'vendors'
  | 'reports'
  | 'business-calendar'
  | 'market-intelligence'
  | 'notifications'
  | 'settings'
  | 'users'

const ROLE_MATRIX: Record<Role, PermissionAction[]> = {
  admin: ['view', 'create', 'edit', 'delete', 'approve'],
  procurement_manager: ['view', 'create', 'edit', 'approve'],
  warehouse_manager: ['view', 'create', 'edit'],
  production_manager: ['view', 'create', 'edit'],
  vendor: ['view'],
  viewer: ['view'],
}

// `resource` is accepted (not used in the check) so call sites already read correctly if the
// backend ever splits permissions per-resource — today every resource follows the same rule.
export function canAccess(role: Role, _resource: PermissionResource, action: PermissionAction): boolean {
  return ROLE_MATRIX[role]?.includes(action) ?? false
}

export const ALL_ROLES: Role[] = ['admin', 'procurement_manager', 'warehouse_manager', 'production_manager', 'vendor', 'viewer']

export function roleLabel(role: Role): string {
  return role
    .split('_')
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(' ')
}
