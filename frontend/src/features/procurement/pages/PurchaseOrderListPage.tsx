import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, ShoppingCart, Sparkles } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Button } from '@/shared/ui/Button'
import { SearchInput } from '@/shared/ui/SearchInput'
import { FilterBar, FilterChip } from '@/shared/ui/FilterBar'
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable'
import { Pagination } from '@/shared/ui/Pagination'
import { StatCard } from '@/shared/ui/StatCard'
import { RoleGuard } from '@/app/router/RoleGuard'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { usePagination } from '@/shared/hooks/usePagination'
import { formatCompactCurrency, formatDate, formatNumber } from '@/shared/lib/formatters'
import { useVendors } from '@/features/vendors/hooks/useVendors'
import type { PurchaseOrder, PurchaseOrderStatus } from '@/types/entities/purchaseOrder'
import { usePurchaseOrders } from '../hooks/usePurchaseOrders'
import { POStatusBadge } from '../components/POStatusBadge'

const STATUS_FILTERS: { label: string; value?: PurchaseOrderStatus }[] = [
  { label: 'All' },
  { label: 'Pending Approval', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Ordered', value: 'ordered' },
  { label: 'In Transit', value: 'in_transit' },
  { label: 'Received', value: 'received' },
  { label: 'Cancelled', value: 'cancelled' },
]

export function PurchaseOrderListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PurchaseOrderStatus | undefined>(undefined)
  const { page, pageSize, setPage } = usePagination(1, 10)
  const debouncedSearch = useDebounce(search)

  const { data, isLoading } = usePurchaseOrders({ page, pageSize, search: debouncedSearch, status })
  // Stat cards summarize every PO, not just the current page — a separate, unfiltered fetch.
  const { data: allData } = usePurchaseOrders({ pageSize: 10000 })
  const allPurchaseOrders = allData?.items ?? []
  const { data: vendorsData } = useVendors({ pageSize: 10000 })
  const getVendorById = (id: string) => vendorsData?.items.find((v) => v.id === id)

  const pendingCount = allPurchaseOrders.filter((po) => po.status === 'pending_approval').length
  const inTransitCount = allPurchaseOrders.filter((po) => po.status === 'in_transit').length
  const openValue = allPurchaseOrders.filter((po) => !['received', 'cancelled'].includes(po.status)).reduce((sum, po) => sum + po.totalAmount, 0)

  const columns: DataTableColumn<PurchaseOrder>[] = [
    {
      key: 'poNumber',
      header: 'PO Number',
      render: (po) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <ShoppingCart className="size-4" />
          </div>
          <span className="font-medium text-foreground">{po.poNumber}</span>
        </div>
      ),
    },
    { key: 'vendor', header: 'Vendor', render: (po) => getVendorById(po.vendorId)?.name ?? '—' },
    { key: 'items', header: 'Items', render: (po) => `${po.items.length} materials` },
    { key: 'total', header: 'Total', render: (po) => formatCompactCurrency(po.totalAmount) },
    { key: 'status', header: 'Status', render: (po) => <POStatusBadge status={po.status} /> },
    { key: 'expected', header: 'Expected Delivery', render: (po) => formatDate(po.expectedDeliveryDate) },
  ]

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        description="Track procurement from recommendation through delivery."
        actions={
          <>
            <Button variant="outline" leftIcon={<Sparkles className="size-4" />} onClick={() => navigate('/app/procurement/recommendations')}>
              AI Recommendations
            </Button>
            <RoleGuard resource="purchase-orders" action="create">
              <Button leftIcon={<PlusCircle className="size-4" />} onClick={() => navigate('/app/procurement/purchase-orders/new')}>
                Create Purchase Order
              </Button>
            </RoleGuard>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending Approval" value={formatNumber(pendingCount)} tone="warning" />
        <StatCard label="In Transit" value={formatNumber(inTransitCount)} tone="info" />
        <StatCard label="Open PO Value" value={formatCompactCurrency(openValue)} tone="primary" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by PO number…" className="sm:max-w-sm" />
        <FilterBar>
          {STATUS_FILTERS.map((f) => (
            <FilterChip key={f.label} active={status === f.value} onClick={() => setStatus(f.value)}>
              {f.label}
            </FilterChip>
          ))}
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        rowKey={(po) => po.id}
        onRowClick={(po) => navigate(`/app/procurement/purchase-orders/${po.id}`)}
        emptyTitle="No purchase orders found"
      />

      {data && data.total > 0 && (
        <div className="mt-4">
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} total={data.total} pageSize={data.pageSize} />
        </div>
      )}
    </div>
  )
}
