import type { BillOfMaterials, BOMLineItem } from '@/types/entities/bom'
import { createSeededRandom, seededFloat, daysAgoISO, seededInt } from '../generators/seedRandom'
import { makeIdFactory } from '../generators/idGenerator'
import { products } from './products.seed'
import { rawMaterials } from './rawMaterials.seed'

const rand = createSeededRandom(4004)
const nextId = makeIdFactory('bom')

function rm(code: string) {
  const material = rawMaterials.find((m) => m.code === code)
  if (!material) throw new Error(`Seed error: raw material code "${code}" not found`)
  return material
}

function line(code: string, quantityPerUnit: number, scrapPct = 2): BOMLineItem {
  const material = rm(code)
  return { rawMaterialId: material.id, quantityPerUnit, unit: material.unit, scrapPct }
}

function findProduct(name: string) {
  const product = products.find((p) => p.name === name)
  if (!product) throw new Error(`Seed error: product "${name}" not found`)
  return product
}

interface BomDefinition {
  productName: string
  materials: BOMLineItem[]
}

const DEFINITIONS: BomDefinition[] = [
  {
    productName: 'Classic White Sandwich Bread',
    materials: [line('RM-FLR-01', 0.42), line('RM-WTR-01', 0.24), line('RM-YST-01', 0.012), line('RM-SLT-01', 0.008), line('RM-SUG-01', 0.02), line('RM-PKG-01', 0.002, 1)],
  },
  {
    productName: 'Whole Wheat Loaf',
    materials: [line('RM-FLR-02', 0.44), line('RM-WTR-01', 0.25), line('RM-YST-01', 0.012), line('RM-SLT-01', 0.008), line('RM-PKG-01', 0.002, 1)],
  },
  {
    productName: 'Cinnamon Raisin Bread',
    materials: [line('RM-FLR-01', 0.4), line('RM-SUG-02', 0.05), line('RM-CIN-01', 0.006), line('RM-YST-01', 0.012), line('RM-PKG-01', 0.002, 1)],
  },
  {
    productName: 'Chocolate Chip Cookies',
    materials: [line('RM-FLR-01', 0.28), line('RM-BTR-01', 0.14), line('RM-SUG-02', 0.12), line('RM-CHC-01', 0.18), line('RM-BKP-01', 0.006), line('RM-PKG-04', 1, 1)],
  },
  {
    productName: 'Oatmeal Raisin Cookies',
    materials: [line('RM-OAT-01', 0.3), line('RM-FLR-01', 0.18), line('RM-BTR-01', 0.12), line('RM-SUG-02', 0.1), line('RM-PKG-04', 1, 1)],
  },
  {
    productName: 'Vanilla Pound Cake',
    materials: [line('RM-FLR-01', 0.32), line('RM-BTR-01', 0.22), line('RM-SUG-01', 0.24), line('RM-VAN-01', 0.01), line('RM-BKP-01', 0.008), line('RM-PKG-02', 1, 1)],
  },
  {
    productName: 'Sparkling Lemonade',
    materials: [line('RM-WTR-01', 0.85), line('RM-SUG-01', 0.09), line('RM-LEM-01', 0.06), line('RM-PKG-03', 1, 1)],
  },
  {
    productName: 'Orange Juice (1L)',
    materials: [line('RM-WTR-01', 0.15), line('RM-SUG-01', 0.03), line('RM-PRE-01', 0.002), line('RM-PKG-03', 1, 1)],
  },
  {
    productName: 'Iced Tea — Peach',
    materials: [line('RM-WTR-01', 0.9), line('RM-SUG-01', 0.07), line('RM-PRE-01', 0.002), line('RM-PKG-03', 1, 1)],
  },
  {
    productName: 'Potato Chips — Original',
    materials: [line('RM-POT-01', 0.38), line('RM-OIL-01', 0.09), line('RM-SLT-01', 0.012), line('RM-PKG-01', 0.002, 1)],
  },
  {
    productName: 'Tortilla Corn Chips',
    materials: [line('RM-FLR-03', 0.32), line('RM-OIL-02', 0.08), line('RM-SLT-01', 0.01), line('RM-PKG-01', 0.002, 1)],
  },
  {
    productName: 'Granola Bars (8-pack)',
    materials: [line('RM-OAT-01', 0.36), line('RM-HON-01', 0.14), line('RM-CHC-01', 0.08), line('RM-PKG-04', 1, 1)],
  },
  {
    productName: 'Vanilla Yogurt (4-pack)',
    materials: [line('RM-MLK-01', 0.72), line('RM-YOG-01', 0.05), line('RM-SUG-01', 0.06), line('RM-VAN-01', 0.004), line('RM-PKG-03', 4, 1)],
  },
  {
    productName: 'Greek Yogurt — Plain',
    materials: [line('RM-MLK-01', 0.6), line('RM-YOG-01', 0.08), line('RM-PKG-03', 1, 1)],
  },
  {
    productName: 'Mild Cheddar Block',
    materials: [line('RM-MLK-01', 1.1), line('RM-SLT-01', 0.02), line('RM-PKG-01', 0.002, 1)],
  },
  {
    productName: 'Strawberry Jam',
    materials: [line('RM-STR-01', 0.55), line('RM-SUG-01', 0.32), line('RM-LEM-01', 0.03), line('RM-PKG-03', 1, 1)],
  },
  {
    productName: 'Classic Ketchup',
    materials: [line('RM-SUG-01', 0.08), line('RM-SLT-01', 0.015), line('RM-PRE-01', 0.003), line('RM-PKG-03', 1, 1)],
  },
  {
    productName: 'Pancake Syrup',
    materials: [line('RM-SYR-01', 0.7), line('RM-SUG-02', 0.15), line('RM-PKG-03', 1, 1)],
  },
]

export const billsOfMaterials: BillOfMaterials[] = DEFINITIONS.map((def) => {
  const product = findProduct(def.productName)
  product.hasBOM = true
  return {
    id: nextId(),
    productId: product.id,
    version: 'v1.0',
    materials: def.materials,
    laborCostPerUnit: seededFloat(rand, 12, 52, 2),
    overheadCostPerUnit: seededFloat(rand, 6, 28, 2),
    updatedAt: daysAgoISO(seededInt(rand, 1, 90)),
  }
})

export function getBOMByProductId(productId: string): BillOfMaterials | undefined {
  return billsOfMaterials.find((b) => b.productId === productId)
}
