import { createSeededRandom, seededFloat } from '@/shared/lib/seedRandom'
import type { Vendor } from '@/types/entities/vendor'

function hashSeed(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return hash
}

export interface VendorPerformancePoint {
  month: string
  onTimeDeliveryPct: number
  qualityScorePct: number
}

const MONTHS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']

export function getVendorPerformanceHistory(vendor: Vendor): VendorPerformancePoint[] {
  const rand = createSeededRandom(hashSeed(vendor.id))
  return MONTHS.map((month, i) => {
    const isLast = i === MONTHS.length - 1
    return {
      month,
      onTimeDeliveryPct: isLast ? vendor.onTimeDeliveryPct : Math.round(seededFloat(rand, vendor.onTimeDeliveryPct - 12, vendor.onTimeDeliveryPct + 6)),
      qualityScorePct: isLast ? vendor.qualityScorePct : Math.round(seededFloat(rand, vendor.qualityScorePct - 10, vendor.qualityScorePct + 5)),
    }
  })
}
