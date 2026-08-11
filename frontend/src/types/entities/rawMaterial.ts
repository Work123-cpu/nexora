export type RawMaterialStatus = 'active' | 'inactive'

export interface RawMaterial {
  id: string
  code: string
  name: string
  category: string
  unit: string
  unitCost: number
  leadTimeDays: number
  isPerishable: boolean
  primaryVendorId: string
  status: RawMaterialStatus
  createdAt: string
}
