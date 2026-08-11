export interface BOMLineItem {
  rawMaterialId: string
  quantityPerUnit: number
  unit: string
  scrapPct: number
}

export interface BillOfMaterials {
  id: string
  productId: string
  version: string
  materials: BOMLineItem[]
  laborCostPerUnit: number
  overheadCostPerUnit: number
  updatedAt: string
  notes?: string
}
