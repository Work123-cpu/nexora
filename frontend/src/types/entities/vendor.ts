export type VendorStatus = 'active' | 'inactive' | 'under-review'

export interface Vendor {
  id: string
  name: string
  category: string
  contactName: string
  email: string
  phone: string
  city: string
  country: string
  rating: number
  onTimeDeliveryPct: number
  qualityScorePct: number
  leadTimeDays: number
  activeContracts: number
  materialsSupplied: string[]
  status: VendorStatus
  createdAt: string
}
