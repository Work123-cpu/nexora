import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boxes, CircleCheck, Layers, ListTree, PackagePlus, Pencil, Trash2, Upload } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Button } from '@/shared/ui/Button'
import { StatCard } from '@/shared/ui/StatCard'
import { SearchInput } from '@/shared/ui/SearchInput'
import { FilterBar, FilterChip } from '@/shared/ui/FilterBar'
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable'
import { Pagination } from '@/shared/ui/Pagination'
import { IconButton } from '@/shared/ui/IconButton'
import { BulkImportDialog } from '@/shared/ui/BulkImportDialog'
import { useToast } from '@/shared/ui/Toast'
import { RoleGuard } from '@/app/router/RoleGuard'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { usePagination } from '@/shared/hooks/usePagination'
import { formatCurrency, formatDate, formatNumber } from '@/shared/lib/formatters'
import { contrastColor } from '@/shared/lib/contrastColor'
import { PRODUCT_CATEGORIES } from '../constants'
import type { Product } from '@/types/entities/product'
import { useCreateProduct, useProducts } from '../hooks/useProducts'
import { useBOMs } from '@/features/bom/hooks/useBOM'
import type { ProductInput } from '../services/productService'
import { mapProductCsvRow, PRODUCT_CSV_TEMPLATE } from '../lib/csvMapper'
import { ProductStatusBadge } from '../components/ProductStatusBadge'
import { DeleteProductDialog } from '../components/DeleteProductDialog'

export function ProductListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [importOpen, setImportOpen] = useState(false)
  const createProduct = useCreateProduct()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [sortBy, setSortBy] = useState<string | undefined>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const { page, pageSize, setPage } = usePagination(1, 10)
  const debouncedSearch = useDebounce(search)

  const { data, isLoading } = useProducts({ page, pageSize, search: debouncedSearch, category, sortBy, sortDir })

  // Stat cards summarize every product, not just the current page — a separate, unfiltered
  // fetch, since `data` above only has this page's rows.
  const { data: allData } = useProducts({ pageSize: 10000 })
  const allProducts = allData?.items ?? []
  const activeCount = allProducts.filter((p) => p.status === 'active').length

  // product.hasBOM isn't reliable against the real backend (always false there) — cross-reference
  // the live BOM list directly instead, same fix already applied in BomForm.tsx.
  const { data: bomsData } = useBOMs({ pageSize: 10000 })
  const bomProductIds = new Set((bomsData?.items ?? []).map((b) => b.productId))
  const linkedToBomCount = allProducts.filter((p) => bomProductIds.has(p.id)).length

  const handleSort = (key: string) => {
    if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else {
      setSortBy(key)
      setSortDir('asc')
    }
  }

  const columns: DataTableColumn<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: p.accentColor, color: contrastColor(p.accentColor) }}
          >
            <Layers className="size-4" />
          </div>
          <div>
            <p className="font-medium text-foreground">{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.sku}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', sortable: true, render: (p) => p.category },
    { key: 'unitPrice', header: 'Price', sortable: true, render: (p) => formatCurrency(p.unitPrice, true) },
    { key: 'unitCost', header: 'Cost', sortable: true, render: (p) => formatCurrency(p.unitCost, true) },
    { key: 'hasBOM', header: 'BOM', render: (p) => (bomProductIds.has(p.id) ? <span className="text-success">Linked</span> : <span className="text-muted-foreground">None</span>) },
    { key: 'status', header: 'Status', render: (p) => <ProductStatusBadge status={p.status} /> },
    { key: 'updatedAt', header: 'Updated', sortable: true, render: (p) => formatDate(p.updatedAt) },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-0',
      render: (p) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <RoleGuard resource="products" action="edit">
            <IconButton
              icon={<Pencil className="size-3.5" />}
              variant="ghost"
              aria-label={`Edit ${p.name}`}
              onClick={() => navigate(`/app/products/${p.id}/edit`)}
            />
          </RoleGuard>
          <RoleGuard resource="products" action="delete">
            <IconButton
              icon={<Trash2 className="size-3.5" />}
              variant="danger"
              aria-label={`Delete ${p.name}`}
              onClick={() => setProductToDelete(p)}
            />
          </RoleGuard>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your finished-goods catalog, pricing, and BOM linkage."
        actions={
          <RoleGuard resource="products" action="create">
            <div className="flex items-center gap-2">
              <Button variant="outline" leftIcon={<Upload className="size-4" />} onClick={() => setImportOpen(true)}>
                Import CSV
              </Button>
              <Button leftIcon={<PackagePlus className="size-4" />} onClick={() => navigate('/app/products/new')}>
                Add Product
              </Button>
            </div>
          </RoleGuard>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Products" value={formatNumber(allProducts.length)} icon={<Boxes className="size-5" />} tone="primary" />
        <StatCard label="Active" value={formatNumber(activeCount)} icon={<CircleCheck className="size-5" />} tone="success" />
        <StatCard label="Linked to a BOM" value={formatNumber(linkedToBomCount)} icon={<ListTree className="size-5" />} tone="info" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search products by name, SKU, or category…" className="sm:max-w-sm" />
        <FilterBar>
          <FilterChip active={!category} onClick={() => setCategory(undefined)}>
            All categories
          </FilterChip>
          {PRODUCT_CATEGORIES.map((cat) => (
            <FilterChip key={cat} active={category === cat} onClick={() => setCategory(cat)}>
              {cat}
            </FilterChip>
          ))}
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        rowKey={(p) => p.id}
        onRowClick={(p) => navigate(`/app/products/${p.id}`)}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={handleSort}
        emptyTitle="No products found"
        emptyDescription="Try a different search term or category filter."
      />

      {data && data.total > 0 && (
        <div className="mt-4">
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} total={data.total} pageSize={data.pageSize} />
        </div>
      )}

      <DeleteProductDialog product={productToDelete} onClose={() => setProductToDelete(null)} />

      <BulkImportDialog<ProductInput>
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Bulk Import Products"
        description="Upload a CSV to add many products at once."
        templateFilename={PRODUCT_CSV_TEMPLATE.filename}
        templateHeaders={PRODUCT_CSV_TEMPLATE.headers}
        templateExampleRow={PRODUCT_CSV_TEMPLATE.exampleRow(PRODUCT_CATEGORIES[0] ?? 'Bakery')}
        mapRow={mapProductCsvRow}
        onImportRow={(input) => createProduct.mutateAsync(input)}
        onImported={(count) => toast({ title: 'Import complete', description: `${count} product(s) added.`, tone: 'success' })}
      />
    </div>
  )
}
