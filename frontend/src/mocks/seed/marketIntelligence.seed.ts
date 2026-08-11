import type { MarketIndicator, MarketIndicatorCategory, MarketImpactLevel } from '@/types/entities/marketIntelligence'
import { createSeededRandom, seededFloat, daysAgoISO } from '../generators/seedRandom'
import { makeIdFactory } from '../generators/idGenerator'
import { rawMaterials } from './rawMaterials.seed'

const rand = createSeededRandom(11011)
const nextId = makeIdFactory('mkt')

function materialIds(...codes: string[]): string[] {
  return codes.map((code) => rawMaterials.find((rm) => rm.code === code)?.id).filter((id): id is string => Boolean(id))
}

function buildHistory(base: number, points = 14, volatility = 0.03): number[] {
  const history: number[] = []
  let value = base * seededFloat(rand, 0.9, 1.0)
  for (let i = 0; i < points; i++) {
    value = value * (1 + seededFloat(rand, -volatility, volatility))
    history.push(Number(value.toFixed(2)))
  }
  history[history.length - 1] = base
  return history
}

interface IndicatorSeed {
  category: MarketIndicatorCategory
  name: string
  value: number
  unit: string
  changePct: number
  relatedRawMaterialIds: string[]
  impactLevel: MarketImpactLevel
  summary: string
}

const DEFINITIONS: IndicatorSeed[] = [
  {
    category: 'commodity',
    name: 'Wheat',
    value: 6.85,
    unit: 'USD / bushel',
    changePct: 4.2,
    relatedRawMaterialIds: materialIds('RM-FLR-01', 'RM-FLR-02'),
    impactLevel: 'high',
    summary: 'Wheat futures rose on lower-than-expected harvest yields in key growing regions — flour costs likely to increase within 2-3 weeks.',
  },
  {
    category: 'commodity',
    name: 'Cocoa',
    value: 4210,
    unit: 'USD / tonne',
    changePct: 6.2,
    relatedRawMaterialIds: materialIds('RM-COC-01', 'RM-CHC-01'),
    impactLevel: 'high',
    summary: 'Cocoa prices surged after West African supply disruptions — chocolate-based product costs directly exposed.',
  },
  {
    category: 'commodity',
    name: 'Raw Sugar',
    value: 0.24,
    unit: 'USD / lb',
    changePct: -1.8,
    relatedRawMaterialIds: materialIds('RM-SUG-01', 'RM-SUG-02', 'RM-SYR-01'),
    impactLevel: 'low',
    summary: 'Sugar prices eased slightly on improved Brazilian output — minor favorable impact on sweetened product margins.',
  },
  {
    category: 'commodity',
    name: 'Milk Class III',
    value: 18.4,
    unit: 'USD / cwt',
    changePct: 3.1,
    relatedRawMaterialIds: materialIds('RM-MLK-01', 'RM-MLK-02', 'RM-BTR-01', 'RM-CRM-01'),
    impactLevel: 'medium',
    summary: 'Dairy futures climbed on reduced herd sizes — monitor yogurt and cheese product margins over the next month.',
  },
  {
    category: 'commodity',
    name: 'Sunflower Oil',
    value: 1.12,
    unit: 'USD / liter',
    changePct: 2.4,
    relatedRawMaterialIds: materialIds('RM-OIL-01'),
    impactLevel: 'medium',
    summary: 'Sunflower oil prices rose modestly due to export restrictions in a major producing region.',
  },
  {
    category: 'commodity',
    name: 'Steel',
    value: 720,
    unit: 'USD / tonne',
    changePct: 5.5,
    relatedRawMaterialIds: [],
    impactLevel: 'none',
    summary: 'Steel prices rose on tariff news — no impact on your business since no products or materials use steel.',
  },
  {
    category: 'fuel',
    name: 'Diesel (India Average)',
    value: 91.8,
    unit: '₹ / liter',
    changePct: 2.7,
    relatedRawMaterialIds: [],
    impactLevel: 'medium',
    summary: 'Rising diesel prices increase inbound freight and last-mile distribution costs across all warehouses.',
  },
  {
    category: 'fuel',
    name: 'Crude Oil (Brent)',
    value: 81.3,
    unit: 'USD / barrel',
    changePct: 1.4,
    relatedRawMaterialIds: materialIds('RM-PKG-01'),
    impactLevel: 'low',
    summary: 'Crude oil ticked up, a modest input cost factor for plastic packaging film production.',
  },
  {
    category: 'exchange-rate',
    name: 'USD / INR',
    value: 83.4,
    unit: 'rate',
    changePct: 0.6,
    relatedRawMaterialIds: materialIds('RM-VAN-01'),
    impactLevel: 'medium',
    summary: 'Rupee depreciation against the dollar raises the landed cost of USD-denominated vanilla imports.',
  },
  {
    category: 'exchange-rate',
    name: 'EUR / INR',
    value: 90.2,
    unit: 'rate',
    changePct: -0.4,
    relatedRawMaterialIds: materialIds('RM-CIN-01'),
    impactLevel: 'low',
    summary: 'A slightly weaker euro modestly reduces the cost of euro-invoiced spice imports.',
  },
  {
    category: 'inflation',
    name: 'India CPI (Food & Beverages)',
    value: 5.1,
    unit: '% YoY',
    changePct: 0.4,
    relatedRawMaterialIds: [],
    impactLevel: 'medium',
    summary: 'Food inflation remains elevated, which may pressure consumer demand for premium-tier products.',
  },
  {
    category: 'global-event',
    name: 'Panama Canal Drought Restrictions',
    value: 0,
    unit: 'status',
    changePct: 0,
    relatedRawMaterialIds: materialIds('RM-COC-01', 'RM-CIN-01'),
    impactLevel: 'medium',
    summary: 'Reduced canal transit capacity is extending lead times for cocoa and spice shipments by 5-8 days.',
  },
  {
    category: 'global-event',
    name: 'European Port Labor Action',
    value: 0,
    unit: 'status',
    changePct: 0,
    relatedRawMaterialIds: [],
    impactLevel: 'none',
    summary: 'A labor dispute at European ports is ongoing but does not affect any of your current supply routes.',
  },
  {
    category: 'supply-chain-risk',
    name: 'North Indian Wheat Belt Drought Risk',
    value: 62,
    unit: 'risk index / 100',
    changePct: 8,
    relatedRawMaterialIds: materialIds('RM-FLR-01', 'RM-FLR-02', 'RM-OAT-01'),
    impactLevel: 'high',
    summary: 'Elevated drought risk across Punjab and Haryana threatens flour and oat supply stability into next quarter.',
  },
  {
    category: 'supply-chain-risk',
    name: 'Packaging Resin Shortage Risk',
    value: 41,
    unit: 'risk index / 100',
    changePct: -5,
    relatedRawMaterialIds: materialIds('RM-PKG-01', 'RM-PKG-03'),
    impactLevel: 'low',
    summary: 'Resin supply risk has eased as new production capacity comes online, reducing packaging cost volatility.',
  },
]

export const marketIndicators: MarketIndicator[] = DEFINITIONS.map((def) => ({
  id: nextId(),
  category: def.category,
  name: def.name,
  value: def.value,
  unit: def.unit,
  changePct: def.changePct,
  relatedRawMaterialIds: def.relatedRawMaterialIds,
  impactLevel: def.impactLevel,
  summary: def.summary,
  updatedAt: daysAgoISO(0),
  history: buildHistory(def.value || 1),
}))

/** @deprecated demo-only — always relative to the built-in seed catalog, not a real company's own materials. Use getRelevantIndicatorsFor. */
export function getRelevantIndicators(): MarketIndicator[] {
  return marketIndicators.filter((m) => m.relatedRawMaterialIds.length > 0 && m.impactLevel !== 'none')
}

/**
 * Company-independent relevance check: matches an indicator's affected materials
 * (by name, since indicator IDs reference this file's own seed catalog) against
 * the given company's real raw material names.
 */
export function getRelevantIndicatorsFor(companyRawMaterials: { name: string }[]): MarketIndicator[] {
  if (companyRawMaterials.length === 0) return []
  return marketIndicators.filter((m) => {
    if (m.impactLevel === 'none' || m.relatedRawMaterialIds.length === 0) return false
    const seedNames = m.relatedRawMaterialIds.map((id) => rawMaterials.find((rm) => rm.id === id)?.name).filter((n): n is string => Boolean(n))
    return seedNames.some((seedName) =>
      companyRawMaterials.some(
        (rm) => rm.name.toLowerCase().includes(seedName.toLowerCase()) || seedName.toLowerCase().includes(rm.name.toLowerCase()),
      ),
    )
  })
}
