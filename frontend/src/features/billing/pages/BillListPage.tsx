import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Receipt } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Button } from '@/shared/ui/Button'
import { SearchInput } from '@/shared/ui/SearchInput'
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable'
import { Pagination } from '@/shared/ui/Pagination'
import { StatCard } from '@/shared/ui/StatCard'
import { Badge } from '@/shared/ui/Badge'
import { RoleGuard } from '@/app/router/RoleGuard'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { usePagination } from '@/shared/hooks/usePagination'
import { formatCompactCurrency, formatDate, formatNumber } from '@/shared/lib/formatters'
import type { Bill } from '@/types/entities/bill'
import { useBills } from '../hooks/useBills'

export function BillListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { page, pageSize, setPage } = usePagination(1, 10)
  const debouncedSearch = useDebounce(search)

  const { data, isLoading } = useBills({ page, pageSize, search: debouncedSearch })
  const { data: allData } = useBills({ pageSize: 10000 })
  const allBills = allData?.items ?? []

  const completed = allBills.filter((b) => b.status === 'completed')
  const totalRevenue = completed.reduce((sum, b) => sum + b.totalAmount, 0)

  const columns: DataTableColumn<Bill>[] = [
    {
      key: 'billNumber',
      header: 'Bill Number',
      render: (b) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Receipt className="size-4" />
          </div>
          <span className="font-medium text-foreground">{b.billNumber}</span>
        </div>
      ),
    },
    { key: 'customer', header: 'Customer', render: (b) => b.customerName },
    { key: 'items', header: 'Items', render: (b) => `${b.items.length} product${b.items.length === 1 ? '' : 's'}` },
    { key: 'total', header: 'Total', render: (b) => formatCompactCurrency(b.totalAmount) },
    { key: 'status', header: 'Status', render: (b) => <Badge tone={b.status === 'completed' ? 'success' : 'neutral'} className="capitalize">{b.status}</Badge> },
    { key: 'date', header: 'Date', render: (b) => formatDate(b.createdAt) },
  ]

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Bill a customer for products — completing a bill deducts the sold quantity from real inventory."
        actions={
          <RoleGuard resource="billing" action="create">
            <Button leftIcon={<PlusCircle className="size-4" />} onClick={() => navigate('/app/billing/new')}>
              New Bill
            </Button>
          </RoleGuard>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Bills" value={formatNumber(allBills.length)} icon={<Receipt className="size-5" />} tone="primary" />
        <StatCard label="Completed" value={formatNumber(completed.length)} tone="success" />
        <StatCard label="Revenue Billed" value={formatCompactCurrency(totalRevenue)} tone="info" />
      </div>

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by bill number or customer…" className="sm:max-w-sm" />
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        rowKey={(b) => b.id}
        onRowClick={(b) => navigate(`/app/billing/${b.id}`)}
        emptyTitle="No bills yet"
        emptyDescription="Create your first bill to record a sale and update stock."
      />

      {data && data.total > 0 && (
        <div className="mt-4">
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} total={data.total} pageSize={data.pageSize} />
        </div>
      )}
    </div>
  )
}
