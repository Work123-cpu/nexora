import { apiClient } from '@/shared/lib/apiClient'

/** Every entity type a company has, fetched raw (backend shape, not the frontend-mapped one) so
 * the export is a complete, faithful snapshot — used for the Settings "Export all data" action
 * that runs before a company deletion. One GET per entity type; the backend has no single
 * "export everything" endpoint, so this composes the same list calls each feature already uses.
 * Keyed by the CSV filename each list becomes inside the export ZIP (see exportManyAsCsvZip). */
export async function fetchCompanyExport(): Promise<Record<string, object[]>> {
  const [products, rawMaterials, boms, warehouses, inventory, movements, purchaseOrders, bills, vendors, calendarEvents, notifications, team] =
    await Promise.all([
      apiClient.get<object[]>('/products'),
      apiClient.get<object[]>('/raw-materials'),
      apiClient.get<object[]>('/bom'),
      apiClient.get<object[]>('/warehouses'),
      apiClient.get<object[]>('/inventory'),
      apiClient.get<object[]>('/inventory/movements').catch(() => []), // admin-only; empty for non-admins
      apiClient.get<object[]>('/purchase-orders'),
      apiClient.get<object[]>('/bills'),
      apiClient.get<object[]>('/vendors'),
      apiClient.get<object[]>('/calendar-events'),
      apiClient.get<object[]>('/notifications'),
      apiClient.get<object[]>('/team'),
    ])

  return {
    products,
    'raw-materials': rawMaterials,
    'bills-of-materials': boms,
    warehouses,
    inventory,
    'stock-movements': movements,
    'purchase-orders': purchaseOrders,
    bills,
    vendors,
    'calendar-events': calendarEvents,
    notifications,
    team,
  }
}
