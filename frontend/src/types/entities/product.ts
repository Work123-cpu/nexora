export type ProductStatus = 'active' | 'inactive' | 'discontinued'

export interface Product {
  id: string
  sku: string
  name: string
  category: string
  description: string
  unitOfMeasure: string
  unitPrice: number
  unitCost: number
  status: ProductStatus
  hasBOM: boolean
  accentColor: string
  createdAt: string
  updatedAt: string
}
