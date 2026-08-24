import type { RawMaterialInput } from '../services/rawMaterialService'
import type { Vendor } from '@/types/entities/vendor'

export const RAW_MATERIAL_CSV_TEMPLATE = {
  filename: 'raw-materials-template.csv',
  headers: ['name', 'code', 'category', 'unit', 'unitCost', 'leadTimeDays', 'vendor', 'isPerishable'],
  exampleRow: (vendors: Vendor[]) => ['Cashew Nuts', 'RM-NUT-01', 'Grains', 'kg', '450', '7', vendors[0]?.name ?? 'Local Supplier', 'false'],
}

/** Same as RawMaterialInput, but with a vendor *name* instead of a resolved primaryVendorId —
 * vendor lookup/creation happens at import time (see RawMaterialListPage.tsx), not here, since an
 * unmatched name should create a new vendor rather than fail the whole row. */
export interface RawMaterialCsvInput extends Omit<RawMaterialInput, 'primaryVendorId'> {
  vendorName: string
}

export function mapRawMaterialCsvRow(row: Record<string, string>): { input: RawMaterialCsvInput } | { error: string } {
  const name = row.name?.trim()
  const code = row.code?.trim()
  if (!name) return { error: 'Missing name' }
  if (!code) return { error: 'Missing code' }

  const unitCost = Number(row.unitCost)
  if (!unitCost || unitCost <= 0) return { error: 'Invalid unitCost' }

  const vendorName = row.vendor?.trim()
  if (!vendorName) return { error: 'Missing vendor — even a new supplier name is fine, it will be created automatically.' }

  const category = row.category?.trim()
  if (!category) return { error: 'Missing category — even a new category name is fine, it will be added automatically.' }

  return {
    input: {
      name,
      code,
      category,
      unit: row.unit?.trim() || 'kg',
      unitCost,
      leadTimeDays: Number(row.leadTimeDays) || 5,
      isPerishable: row.isPerishable?.trim().toLowerCase() === 'true',
      vendorName,
      status: 'active',
    },
  }
}
