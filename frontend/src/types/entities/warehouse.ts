export type WarehouseType = 'raw-material' | 'finished-goods' | 'mixed' | 'cold-storage'

export interface Warehouse {
  id: string
  name: string
  code: string
  type: WarehouseType
  city: string
  state: string
  country: string
  managerName: string
  capacityUnits: number
  usedUnits: number
  status: 'operational' | 'maintenance' | 'at-capacity'
}
