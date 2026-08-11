import { useNavigate } from 'react-router-dom'
import { ListTree, Pencil, PlusCircle, Trash2 } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Button } from '@/shared/ui/Button'
import { SearchInput } from '@/shared/ui/SearchInput'
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable'
import { IconButton } from '@/shared/ui/IconButton'
import { Badge } from '@/shared/ui/Badge'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { formatCurrency, formatDate } from '@/shared/lib/formatters'
import { useBOMs, useDeleteBOM } from '../hooks/useBOM'
import { calculateTotalUnitCost } from '../lib/calculateBomCost'
import { useState } from 'react'
import { Dialog } from '@/shared/ui/Dialog'
import { useToast } from '@/shared/ui/Toast'
import { RoleGuard } from '@/app/router/RoleGuard'
import type { BillOfMaterials } from '@/types/entities/bom'

type BomRow = BillOfMaterials & { productName: string }

export function BomListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const { data, isLoading } = useBOMs({ search: debouncedSearch, pageSize: 50 })
  const deleteBom = useDeleteBOM()
  const { toast } = useToast()
  const [toDelete, setToDelete] = useState<BomRow | null>(null)

  const columns: DataTableColumn<BomRow>[] = [
    {
      key: 'product',
      header: 'Product',
      render: (bom) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <ListTree className="size-4" />
          </div>
          <span className="font-medium text-foreground">{bom.productName}</span>
        </div>
      ),
    },
    { key: 'version', header: 'Version', render: (bom) => <Badge tone="neutral">{bom.version}</Badge> },
    { key: 'materials', header: 'Materials', render: (bom) => `${bom.materials.length} items` },
    { key: 'cost', header: 'Unit Cost', render: (bom) => formatCurrency(calculateTotalUnitCost(bom), true) },
    { key: 'updatedAt', header: 'Updated', render: (bom) => formatDate(bom.updatedAt) },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-0',
      render: (bom) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <RoleGuard resource="bom" action="edit">
            <IconButton icon={<Pencil className="size-3.5" />} variant="ghost" aria-label="Edit BOM" onClick={() => navigate(`/app/bom/${bom.id}/edit`)} />
          </RoleGuard>
          <RoleGuard resource="bom" action="delete">
            <IconButton icon={<Trash2 className="size-3.5" />} variant="danger" aria-label="Delete BOM" onClick={() => setToDelete(bom)} />
          </RoleGuard>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Bill of Materials"
        description="Define the raw materials required to manufacture each product."
        actions={
          <RoleGuard resource="bom" action="create">
            <Button leftIcon={<PlusCircle className="size-4" />} onClick={() => navigate('/app/bom/new')}>
              Create BOM
            </Button>
          </RoleGuard>
        }
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by product name or version…" className="sm:max-w-sm" />
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        rowKey={(bom) => bom.id}
        onRowClick={(bom) => navigate(`/app/bom/${bom.id}/edit`)}
        emptyTitle="No bills of materials yet"
        emptyDescription="Create a BOM to enable material requirement calculations for a product."
      />

      <Dialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Delete BOM"
        description="This action cannot be undone."
        footer={
          <>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={deleteBom.isPending}
              onClick={async () => {
                if (!toDelete) return
                await deleteBom.mutateAsync(toDelete.id)
                toast({ title: 'BOM deleted', tone: 'success' })
                setToDelete(null)
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Delete the bill of materials for <span className="font-medium text-foreground">{toDelete?.productName}</span>?
        </p>
      </Dialog>
    </div>
  )
}
