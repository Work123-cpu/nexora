import type { BillOfMaterials, BOMLineItem } from '@/types/entities/bom'
import { getRawMaterialById } from '@/mocks/seed/rawMaterials.seed'

export function calculateMaterialLineCost(line: BOMLineItem): number {
  const material = getRawMaterialById(line.rawMaterialId)
  if (!material) return 0
  const quantityWithScrap = line.quantityPerUnit * (1 + line.scrapPct / 100)
  return quantityWithScrap * material.unitCost
}

export function calculateMaterialsCost(materials: BOMLineItem[]): number {
  return materials.reduce((sum, line) => sum + calculateMaterialLineCost(line), 0)
}

export function calculateTotalUnitCost(bom: Pick<BillOfMaterials, 'materials' | 'laborCostPerUnit' | 'overheadCostPerUnit'>): number {
  return calculateMaterialsCost(bom.materials) + bom.laborCostPerUnit + bom.overheadCostPerUnit
}
