export type RecommendationCategory = 'reorder' | 'safety-stock' | 'supplier-risk' | 'market-impact' | 'production-plan'

export type RecommendationSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical'

export interface AIRecommendation {
  id: string
  category: RecommendationCategory
  severity: RecommendationSeverity
  title: string
  reason: string
  confidenceScore: number
  businessImpact: string
  expectedBenefit: string
  risks: string[]
  suggestedAction: string
  entityType: 'product' | 'rawMaterial' | 'vendor' | 'warehouse' | 'purchaseOrder'
  entityId: string
  entityName: string
  createdAt: string
}
