import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable'
import { SearchInput } from '@/shared/ui/SearchInput'
import { FilterBar, FilterChip } from '@/shared/ui/FilterBar'
import { Pagination } from '@/shared/ui/Pagination'
import { Badge } from '@/shared/ui/Badge'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { usePagination } from '@/shared/hooks/usePagination'
import { formatNumber } from '@/shared/lib/formatters'
import { useWarehouses } from '@/features/warehouse/hooks/useWarehouses'
import type { InventoryItem } from '@/types/entities/inventory'
import { useInventoryItems } from '../hooks/useInventory'

export function InventoryItemsTable() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [warehouseId, setWarehouseId] = useState<string | undefined>(undefined)
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const { page, pageSize, setPage } = usePagination(1, 8)
  const debouncedSearch = useDebounce(search)

  const { data, isLoading } = useInventoryItems({ page, pageSize, search: debouncedSearch, warehouseId, lowStockOnly, sortBy: 'itemName' })
  const { data: warehousesData } = useWarehouses({ pageSize: 10000 })
  const warehouses = warehousesData?.items ?? []

  const columns: DataTableColumn<InventoryItem>[] = [
    {
      key: 'itemName',
      header: 'Item',
      render: (item) => (
        <div>
          <p className="font-medium text-foreground">{item.itemName}</p>
          <p className="text-xs text-muted-foreground">{item.category}</p>
        </div>
      ),
    },
    { key: 'warehouse', header: 'Warehouse', render: (item) => warehouses.find((w) => w.id === item.warehouseId)?.name ?? '—' },
    { key: 'onHand', header: 'On Hand', render: (item) => `${formatNumber(item.quantityOnHand)} ${item.unit}` },
    {
      key: 'coverage',
      header: 'Stock Coverage',
      render: (item) => {
        const pct = (item.quantityOnHand / item.reorderPoint) * 100
        const isCritical = item.quantityOnHand <= item.safetyStock
        const isLow = item.quantityOnHand <= item.reorderPoint
        return (
          <div className="w-32">
            <ProgressBar value={pct} tone={isCritical ? 'danger' : isLow ? 'warning' : 'success'} />
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const isCritical = item.quantityOnHand <= item.safetyStock
        const isLow = item.quantityOnHand <= item.reorderPoint
        if (isCritical) return <Badge tone="danger">Critical</Badge>
        if (isLow) return <Badge tone="warning">Low</Badge>
        return <Badge tone="success">Healthy</Badge>
      },
    },
  ]

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search inventory by item name…" className="sm:max-w-sm" />
        <FilterBar>
          <FilterChip active={!warehouseId} onClick={() => setWarehouseId(undefined)}>
            All warehouses
          </FilterChip>
          {warehouses.map((wh) => (
            <FilterChip key={wh.id} active={warehouseId === wh.id} onClick={() => setWarehouseId(wh.id)}>
              {wh.name}
            </FilterChip>
          ))}
          <FilterChip active={lowStockOnly} onClick={() => setLowStockOnly(!lowStockOnly)}>
            Low stock only
          </FilterChip>
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        rowKey={(item) => item.id}
        onRowClick={(item) => navigate(item.itemType === 'rawMaterial' ? `/app/raw-materials/${item.itemId}` : `/app/products/${item.itemId}`)}
        emptyTitle="No inventory items found"
      />

      {data && data.total > 0 && (
        <div className="mt-4">
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} total={data.total} pageSize={data.pageSize} />
        </div>
      )}
    </div>
  )
}
