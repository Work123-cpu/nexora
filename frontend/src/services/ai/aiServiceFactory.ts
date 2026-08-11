import type { IAIService } from './AIServiceInterface'
import { mockAIAdapter } from './adapters/mockAIAdapter'
import { httpAIAdapter } from './adapters/httpAIAdapter'

const useMock = import.meta.env.VITE_USE_MOCK_AI !== 'false'

export function createAIService(): IAIService {
  return useMock ? mockAIAdapter : httpAIAdapter
}
