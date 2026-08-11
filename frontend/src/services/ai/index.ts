import { createAIService } from './aiServiceFactory'

export const aiService = createAIService()
export type { IAIService } from './AIServiceInterface'
export * from './types'
