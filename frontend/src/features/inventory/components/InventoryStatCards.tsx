import { AlertTriangle, Boxes, DollarSign, PackageCheck } from 'lucide-react'
import { StatCard } from '@/shared/ui/StatCard'
import { formatCompactCurrency, formatNumber } from '@/shared/lib/formatters'
import { useInventoryItems } from '../hooks/useInventory'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import { useProducts } from '@/features/products/hooks/useProducts'

export function InventoryStatCards() {
  const { data: inventoryData } = useInventoryItems({ pageSize: 10000 })
  const { data: materialsData } = useRawMaterials({ pageSize: 10000 })
  const { data: productsData } = useProducts({ pageSize: 10000 })
  const inventoryItems = inventoryData?.items ?? []
  const rawMaterials = materialsData?.items ?? []
  const products = productsData?.items ?? []

  const critical = inventoryItems.filter((i) => i.quantityOnHand <= i.safetyStock).length
  const lowStock = inventoryItems.filter((i) => i.quantityOnHand <= i.reorderPoint).length
  const healthy = inventoryItems.length - lowStock

  const totalValue = inventoryItems.reduce((sum, item) => {
    const unitCost =
      item.itemType === 'rawMaterial'
        ? rawMaterials.find((rm) => rm.id === item.itemId)?.unitCost ?? 0
        : products.find((p) => p.id === item.itemId)?.unitCost ?? 0
    return sum + item.quantityOnHand * unitCost
  }, 0)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Tracked SKUs" value={formatNumber(inventoryItems.length)} icon={<Boxes className="size-5" />} tone="primary" />
      <StatCard label="Healthy Stock" value={formatNumber(healthy)} icon={<PackageCheck className="size-5" />} tone="success" />
      <StatCard label="Below Reorder Point" value={formatNumber(lowStock)} icon={<AlertTriangle className="size-5" />} tone="warning" />
      <StatCard label="Critical (Below Safety Stock)" value={formatNumber(critical)} icon={<AlertTriangle className="size-5" />} tone="danger" />
      <StatCard label="Total Inventory Value" value={formatCompactCurrency(totalValue)} icon={<DollarSign className="size-5" />} tone="info" className="sm:col-span-2 lg:col-span-4" />
    </div>
  )
}
