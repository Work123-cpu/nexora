import type { AIRecommendation } from '../types'
import type { Product } from '@/types/entities/product'
import type { BillOfMaterials } from '@/types/entities/bom'
import type { Bill } from '@/types/entities/bill'

function makeId(productId: string): string {
  return `rec-missing-bom-${productId}`
}

/** Flags products that are actively selling but have no Bill of Materials yet — without a BOM,
 * Nexora has no link between that product and the raw materials it consumes, so its demand can
 * never roll up into raw-material forecasting no matter how well it's selling. */
export function computeMissingBomRecommendations(products: Product[], boms: BillOfMaterials[], bills: Bill[]): AIRecommendation[] {
  const bomProductIds = new Set(boms.map((b) => b.productId))
  const soldProductIds = new Set(bills.flatMap((b) => b.items.map((i) => i.productId)))

  return products
    .filter((product) => soldProductIds.has(product.id) && !bomProductIds.has(product.id))
    .map((product) => ({
      id: makeId(product.id),
      category: 'production-plan',
      severity: 'medium',
      title: `Define ingredients for ${product.name}`,
      reason: `${product.name} has billing history but no Bill of Materials — Nexora can't forecast the raw materials it consumes until its ingredient list is defined.`,
      confidenceScore: 90,
      businessImpact: 'Raw material demand for this product is invisible to forecasting and reorder recommendations.',
      expectedBenefit: 'Unlocks accurate raw-material demand forecasting for a product that is actively selling.',
      risks: ['Stockouts on ingredients for this product may go undetected until it is too late'],
      suggestedAction: `Create a BOM for ${product.name}`,
      entityType: 'product',
      entityId: product.id,
      entityName: product.name,
      createdAt: new Date().toISOString(),
    }) satisfies AIRecommendation)
}
