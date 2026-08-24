import type { ProductStatus } from '@/types/entities/product'
import type { ProductInput } from '../services/productService'

const VALID_PRODUCT_STATUSES: ProductStatus[] = ['active', 'inactive', 'discontinued']

export const PRODUCT_CSV_TEMPLATE = {
  filename: 'products-template.csv',
  headers: ['name', 'category', 'description', 'unitOfMeasure', 'unitPrice', 'unitCost', 'status'],
  exampleRow: (category: string) => ['Almond Croissant', category, 'Buttery almond-filled croissant', 'pack', '85', '52', 'active'],
}

export function mapProductCsvRow(row: Record<string, string>): { input: ProductInput } | { error: string } {
  const name = row.name?.trim()
  if (!name) return { error: 'Missing name' }

  const unitPrice = Number(row.unitPrice)
  if (!unitPrice || unitPrice <= 0) return { error: 'Invalid unitPrice' }

  const unitCost = Number(row.unitCost)
  if (Number.isNaN(unitCost) || unitCost < 0) return { error: 'Invalid unitCost' }

  const statusRaw = row.status?.trim().toLowerCase() as ProductStatus
  const status = VALID_PRODUCT_STATUSES.includes(statusRaw) ? statusRaw : 'active'

  const category = row.category?.trim()
  if (!category) return { error: 'Missing category — even a new category name is fine, it will be added automatically.' }

  return {
    input: {
      name,
      category,
      description: row.description?.trim() ?? '',
      unitOfMeasure: row.unitOfMeasure?.trim() || 'unit',
      unitPrice,
      unitCost,
      status,
    },
  }
}
