import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Receipt, TrendingUp, Upload } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Button } from '@/shared/ui/Button'
import { SearchInput } from '@/shared/ui/SearchInput'
import { FilterBar, FilterChip } from '@/shared/ui/FilterBar'
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable'
import { Pagination } from '@/shared/ui/Pagination'
import { StatCard } from '@/shared/ui/StatCard'
import { Badge } from '@/shared/ui/Badge'
import { Dialog } from '@/shared/ui/Dialog'
import { BulkImportDialog } from '@/shared/ui/BulkImportDialog'
import { RoleGuard } from '@/app/router/RoleGuard'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { usePagination } from '@/shared/hooks/usePagination'
import { formatCompactCurrency, formatDate, formatNumber } from '@/shared/lib/formatters'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useWarehouses } from '@/features/warehouse/hooks/useWarehouses'
import type { Bill, BillStatus } from '@/types/entities/bill'
import { useBills, useCreateBill } from '../hooks/useBills'
import type { BillInput } from '../services/billService'
import { mapSalesHistoryCsvRow, SALES_HISTORY_CSV_TEMPLATE } from '../lib/salesHistoryCsvMapper'

export function BillListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<BillStatus | undefined>(undefined)
  const [importOpen, setImportOpen] = useState(false)
  const [importedCount, setImportedCount] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<string | undefined>('billNumber')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const { page, pageSize, setPage } = usePagination(1, 10)
  const debouncedSearch = useDebounce(search)
  const createBill = useCreateBill()

  const { data, isLoading } = useBills({ page, pageSize, search: debouncedSearch, status, sortBy, sortDir })

  const handleSort = (key: string) => {
    if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else {
      setSortBy(key)
      setSortDir('asc')
    }
  }
  const { data: allData } = useBills({ pageSize: 10000 })
  const allBills = allData?.items ?? []
  const { data: productsData } = useProducts({ pageSize: 10000 })
  const products = productsData?.items ?? []
  const { data: warehousesData } = useWarehouses({ pageSize: 10000 })
  const warehouses = warehousesData?.items ?? []

  const completed = allBills.filter((b) => b.status === 'completed')
  const totalRevenue = completed.reduce((sum, b) => sum + b.totalAmount, 0)

  const columns: DataTableColumn<Bill>[] = [
    {
      key: 'billNumber',
      header: 'Bill Number',
      sortable: true,
      render: (b) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Receipt className="size-4" />
          </div>
          <span className="font-medium text-foreground">{b.billNumber}</span>
        </div>
      ),
    },
    { key: 'customerName', header: 'Customer', sortable: true, render: (b) => b.customerName },
    { key: 'items', header: 'Items', render: (b) => `${b.items.length} product${b.items.length === 1 ? '' : 's'}` },
    { key: 'totalAmount', header: 'Total', sortable: true, render: (b) => formatCompactCurrency(b.totalAmount) },
    { key: 'status', header: 'Status', render: (b) => <Badge tone={b.status === 'completed' ? 'success' : 'neutral'} className="capitalize">{b.status}</Badge> },
    { key: 'createdAt', header: 'Date', sortable: true, render: (b) => formatDate(b.createdAt) },
  ]

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Bill a customer for products — completing a bill deducts the sold quantity from real inventory."
        actions={
          <RoleGuard resource="billing" action="create">
            <div className="flex items-center gap-2">
              <Button variant="outline" leftIcon={<Upload className="size-4" />} onClick={() => setImportOpen(true)}>
                Import Sales History
              </Button>
              <Button leftIcon={<PlusCircle className="size-4" />} onClick={() => navigate('/app/billing/new')}>
                New Bill
              </Button>
            </div>
          </RoleGuard>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Bills" value={formatNumber(allBills.length)} icon={<Receipt className="size-5" />} tone="primary" />
        <StatCard label="Completed" value={formatNumber(completed.length)} tone="success" />
        <StatCard label="Revenue Billed" value={formatCompactCurrency(totalRevenue)} tone="info" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by bill number or customer…" className="sm:max-w-sm" />
        <FilterBar>
          <FilterChip active={!status} onClick={() => setStatus(undefined)}>
            All statuses
          </FilterChip>
          <FilterChip active={status === 'completed'} onClick={() => setStatus('completed')}>
            Completed
          </FilterChip>
          <FilterChip active={status === 'cancelled'} onClick={() => setStatus('cancelled')}>
            Cancelled
          </FilterChip>
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        rowKey={(b) => b.id}
        onRowClick={(b) => navigate(`/app/billing/${b.id}`)}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={handleSort}
        emptyTitle="No bills yet"
        emptyDescription="Create your first bill to record a sale and update stock."
      />

      {data && data.total > 0 && (
        <div className="mt-4">
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} total={data.total} pageSize={data.pageSize} />
        </div>
      )}

      <BulkImportDialog<BillInput>
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Sales History"
        description="Upload past sales so demand forecasting can learn from your real history. One row = one product sold on one date."
        templateFilename={SALES_HISTORY_CSV_TEMPLATE.filename}
        templateHeaders={SALES_HISTORY_CSV_TEMPLATE.headers}
        templateExampleRow={SALES_HISTORY_CSV_TEMPLATE.exampleRow(products)}
        mapRow={(row) => mapSalesHistoryCsvRow(row, products, warehouses)}
        onImportRow={(input) => createBill.mutateAsync(input)}
        onImported={(count) => setImportedCount(count)}
      />

      <Dialog
        open={importedCount !== null}
        onClose={() => setImportedCount(null)}
        title="Sales history imported"
        description={`${importedCount ?? 0} historical sale${importedCount === 1 ? '' : 's'} added. Products with enough history now feed real demand forecasts.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setImportedCount(null)}>
              Close
            </Button>
            <Button leftIcon={<TrendingUp className="size-4" />} onClick={() => navigate('/app/reports/forecast')}>
              View demand forecast
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          A product needs at least 10 days of real sales history before its forecast switches from a category estimate to one based on your
          own data.
        </p>
      </Dialog>
    </div>
  )
}
