import { RAW_MATERIAL_CATEGORIES } from '@/mocks/seed/rawMaterials.seed'
import type { RawMaterialInput } from '../services/rawMaterialService'
import type { Vendor } from '@/types/entities/vendor'

export const RAW_MATERIAL_CSV_TEMPLATE = {
  filename: 'raw-materials-template.csv',
  headers: ['name', 'code', 'category', 'unit', 'unitCost', 'leadTimeDays', 'vendor', 'isPerishable'],
  exampleRow: (vendors: Vendor[]) => ['Cashew Nuts', 'RM-NUT-01', 'Grains', 'kg', '450', '7', vendors[0]?.name ?? '', 'false'],
}

export function mapRawMaterialCsvRow(row: Record<string, string>, vendors: Vendor[]): { input: RawMaterialInput } | { error: string } {
  const name = row.name?.trim()
  const code = row.code?.trim()
  if (!name) return { error: 'Missing name' }
  if (!code) return { error: 'Missing code' }

  const unitCost = Number(row.unitCost)
  if (!unitCost || unitCost <= 0) return { error: 'Invalid unitCost' }

  const vendor = vendors.find((v) => v.name.toLowerCase() === row.vendor?.trim().toLowerCase())
  if (!vendor) return { error: `Unknown vendor "${row.vendor ?? ''}". Add this vendor first, or use an existing vendor name.` }

  return {
    input: {
      name,
      code,
      category: row.category?.trim() || RAW_MATERIAL_CATEGORIES[0]!,
      unit: row.unit?.trim() || 'kg',
      unitCost,
      leadTimeDays: Number(row.leadTimeDays) || 5,
      isPerishable: row.isPerishable?.trim().toLowerCase() === 'true',
      primaryVendorId: vendor.id,
      status: 'active',
    },
  }
}
