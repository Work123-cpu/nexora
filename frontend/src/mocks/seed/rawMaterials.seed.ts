import type { RawMaterial } from '@/types/entities/rawMaterial'
import { createSeededRandom, seededFloat, seededInt, daysAgoISO } from '../generators/seedRandom'
import { makeIdFactory } from '../generators/idGenerator'
import { VENDOR_IDS } from './vendorIds'

const rand = createSeededRandom(1001)
const nextId = makeIdFactory('rm')

interface RawMaterialSeed {
  code: string
  name: string
  category: string
  unit: string
  vendorId: string
  perishable?: boolean
  costRange: [number, number]
}

// Cost ranges are realistic INR wholesale/B2B ingredient prices, not a blind USD relabel.
const DEFINITIONS: RawMaterialSeed[] = [
  { code: 'RM-FLR-01', name: 'All-Purpose Wheat Flour', category: 'Grains', unit: 'kg', vendorId: VENDOR_IDS.heritageGrainMill, costRange: [32, 45] },
  { code: 'RM-FLR-02', name: 'Whole Wheat Flour', category: 'Grains', unit: 'kg', vendorId: VENDOR_IDS.heritageGrainMill, costRange: [36, 50] },
  { code: 'RM-FLR-03', name: 'Corn Starch', category: 'Grains', unit: 'kg', vendorId: VENDOR_IDS.goldenFieldsGrain, costRange: [45, 68] },
  { code: 'RM-OAT-01', name: 'Rolled Oats', category: 'Grains', unit: 'kg', vendorId: VENDOR_IDS.goldenFieldsGrain, costRange: [95, 150] },
  { code: 'RM-RICE-01', name: 'Rice Flour', category: 'Grains', unit: 'kg', vendorId: VENDOR_IDS.heritageGrainMill, costRange: [52, 80] },
  { code: 'RM-MLK-01', name: 'Fresh Whole Milk', category: 'Dairy', unit: 'liter', vendorId: VENDOR_IDS.prairieDairyCoop, perishable: true, costRange: [48, 62] },
  { code: 'RM-MLK-02', name: 'Milk Powder', category: 'Dairy', unit: 'kg', vendorId: VENDOR_IDS.prairieDairyCoop, costRange: [270, 360] },
  { code: 'RM-BTR-01', name: 'Unsalted Butter', category: 'Dairy', unit: 'kg', vendorId: VENDOR_IDS.prairieDairyCoop, perishable: true, costRange: [440, 560] },
  { code: 'RM-CRM-01', name: 'Heavy Cream', category: 'Dairy', unit: 'liter', vendorId: VENDOR_IDS.prairieDairyCoop, perishable: true, costRange: [260, 340] },
  { code: 'RM-YOG-01', name: 'Yogurt Culture Base', category: 'Dairy', unit: 'liter', vendorId: VENDOR_IDS.prairieDairyCoop, perishable: true, costRange: [150, 220] },
  { code: 'RM-CHS-01', name: 'Mild Cheddar Cheese', category: 'Dairy', unit: 'kg', vendorId: VENDOR_IDS.prairieDairyCoop, perishable: true, costRange: [430, 580] },
  { code: 'RM-SUG-01', name: 'Granulated White Sugar', category: 'Sweeteners', unit: 'kg', vendorId: VENDOR_IDS.sweetSourceIngredients, costRange: [38, 48] },
  { code: 'RM-SUG-02', name: 'Brown Sugar', category: 'Sweeteners', unit: 'kg', vendorId: VENDOR_IDS.sweetSourceIngredients, costRange: [52, 72] },
  { code: 'RM-HON-01', name: 'Raw Honey', category: 'Sweeteners', unit: 'kg', vendorId: VENDOR_IDS.royalHoneyCooperative, costRange: [340, 480] },
  { code: 'RM-SYR-01', name: 'Corn Syrup', category: 'Sweeteners', unit: 'liter', vendorId: VENDOR_IDS.sweetSourceIngredients, costRange: [88, 135] },
  { code: 'RM-COC-01', name: 'Cocoa Powder', category: 'Flavorings', unit: 'kg', vendorId: VENDOR_IDS.cocoalineTraders, costRange: [390, 620] },
  { code: 'RM-CHC-01', name: 'Chocolate Chips', category: 'Flavorings', unit: 'kg', vendorId: VENDOR_IDS.cocoalineTraders, costRange: [430, 670] },
  { code: 'RM-VAN-01', name: 'Vanilla Extract', category: 'Flavorings', unit: 'liter', vendorId: VENDOR_IDS.greenLeafFlavors, costRange: [1750, 2650] },
  { code: 'RM-CIN-01', name: 'Ground Cinnamon', category: 'Flavorings', unit: 'kg', vendorId: VENDOR_IDS.spiceRouteImports, costRange: [520, 850] },
  { code: 'RM-SLT-01', name: 'Refined Iodized Salt', category: 'Additives', unit: 'kg', vendorId: VENDOR_IDS.crystalSaltWorks, costRange: [16, 26] },
  { code: 'RM-YST-01', name: "Baker's Yeast", category: 'Additives', unit: 'kg', vendorId: VENDOR_IDS.sunriseYeastCo, costRange: [310, 460] },
  { code: 'RM-PRE-01', name: 'Citric Acid Preservative', category: 'Additives', unit: 'kg', vendorId: VENDOR_IDS.ironclad_Preservatives, costRange: [210, 330] },
  { code: 'RM-BKP-01', name: 'Baking Powder', category: 'Additives', unit: 'kg', vendorId: VENDOR_IDS.premiumAdditivesLtd, costRange: [135, 210] },
  { code: 'RM-OIL-01', name: 'Sunflower Oil', category: 'Oils', unit: 'liter', vendorId: VENDOR_IDS.purefreshOils, costRange: [105, 155] },
  { code: 'RM-OIL-02', name: 'Olive Oil', category: 'Oils', unit: 'liter', vendorId: VENDOR_IDS.purefreshOils, costRange: [530, 770] },
  { code: 'RM-STR-01', name: 'Fresh Strawberries', category: 'Fruits', unit: 'kg', vendorId: VENDOR_IDS.atlanticFruitCo, perishable: true, costRange: [170, 300] },
  { code: 'RM-LEM-01', name: 'Fresh Lemons', category: 'Fruits', unit: 'kg', vendorId: VENDOR_IDS.freshfieldsFarms, perishable: true, costRange: [55, 110] },
  { code: 'RM-POT-01', name: 'Potatoes (Chipping Grade)', category: 'Fruits', unit: 'kg', vendorId: VENDOR_IDS.freshfieldsFarms, perishable: true, costRange: [17, 28] },
  { code: 'RM-WTR-01', name: 'Purified Water', category: 'Additives', unit: 'liter', vendorId: VENDOR_IDS.clearstreamWaterCo, costRange: [0.8, 1.8] },
  { code: 'RM-PKG-01', name: 'Plastic Wrap Film', category: 'Packaging', unit: 'roll', vendorId: VENDOR_IDS.ecoPackPackaging, costRange: [240, 440] },
  { code: 'RM-PKG-02', name: 'Corrugated Cartons', category: 'Packaging', unit: 'unit', vendorId: VENDOR_IDS.westcoastCartonWorks, costRange: [34, 68] },
  { code: 'RM-PKG-03', name: 'Glass Bottles (500ml)', category: 'Packaging', unit: 'unit', vendorId: VENDOR_IDS.glassAndGlazeContainers, costRange: [20, 42] },
  { code: 'RM-PKG-04', name: 'Printed Product Labels', category: 'Packaging', unit: 'unit', vendorId: VENDOR_IDS.ecoPackPackaging, costRange: [2.5, 6.5] },
]

export const rawMaterials: RawMaterial[] = DEFINITIONS.map((def) => ({
  id: nextId(),
  code: def.code,
  name: def.name,
  category: def.category,
  unit: def.unit,
  unitCost: seededFloat(rand, def.costRange[0], def.costRange[1], 2),
  leadTimeDays: seededInt(rand, 2, 14),
  isPerishable: def.perishable ?? false,
  primaryVendorId: def.vendorId,
  status: 'active',
  createdAt: daysAgoISO(seededInt(rand, 60, 400)),
}))

export function getRawMaterialById(id: string): RawMaterial | undefined {
  return rawMaterials.find((rm) => rm.id === id)
}

export const RAW_MATERIAL_CATEGORIES = Array.from(new Set(rawMaterials.map((rm) => rm.category)))
