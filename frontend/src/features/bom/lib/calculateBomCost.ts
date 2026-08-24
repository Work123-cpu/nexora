import type { BillOfMaterials, BOMLineItem } from '@/types/entities/bom'
import type { RawMaterial } from '@/types/entities/rawMaterial'

/** Takes the live raw materials list as a parameter rather than importing the mock seed
 * directly — a raw material's id only exists in that seed when running against the mock
 * backend. Against the real backend, ids come from the database and never match, so every
 * line silently priced at ₹0. Callers already have the real list via useRawMaterials(). */
export function calculateMaterialLineCost(line: BOMLineItem, rawMaterials: RawMaterial[]): number {
  const material = rawMaterials.find((m) => m.id === line.rawMaterialId)
  if (!material) return 0
  const quantityWithScrap = line.quantityPerUnit * (1 + line.scrapPct / 100)
  return quantityWithScrap * material.unitCost
}

export function calculateMaterialsCost(materials: BOMLineItem[], rawMaterials: RawMaterial[]): number {
  return materials.reduce((sum, line) => sum + calculateMaterialLineCost(line, rawMaterials), 0)
}

export function calculateTotalUnitCost(
  bom: Pick<BillOfMaterials, 'materials' | 'laborCostPerUnit' | 'overheadCostPerUnit'>,
  rawMaterials: RawMaterial[],
): number {
  return calculateMaterialsCost(bom.materials, rawMaterials) + bom.laborCostPerUnit + bom.overheadCostPerUnit
}
