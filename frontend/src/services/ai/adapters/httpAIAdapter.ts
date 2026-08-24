import type { IAIService } from '../AIServiceInterface'
import type {
  BomSuggestRequest,
  BomSuggestResponse,
  ChatRequest,
  ChatResponse,
  ExplainRequest,
  ExplainResponse,
  HelpRequest,
  HelpResponse,
  SummarizeRequest,
  SummarizeResponse,
} from '../types'

/**
 * Talks to the FastAPI ai-service (see /ai-service in the repo root) — never to
 * Groq directly. Fails soft: a down/unstarted backend degrades to a friendly
 * message instead of throwing, so the frontend never crashes on this seam.
 * TODO(ai-service): remove the fail-soft fallback once the backend is always-on.
 */
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL ?? 'http://localhost:8000'

async function post<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const response = await fetch(`${AI_SERVICE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`AI service responded ${response.status}`)
  return (await response.json()) as TResponse
}

const FALLBACK_MESSAGE = 'The AI service is currently unavailable. Please try again shortly.'

export const httpAIAdapter: IAIService = {
  async chat(req: ChatRequest): Promise<ChatResponse> {
    try {
      return await post<ChatResponse>('/api/ai/chat', req)
    } catch {
      return {
        message: {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: FALLBACK_MESSAGE,
          createdAt: new Date().toISOString(),
        },
      }
    }
  },

  async explain(req: ExplainRequest): Promise<ExplainResponse> {
    try {
      return await post<ExplainResponse>('/api/ai/explain', req)
    } catch {
      return { explanation: FALLBACK_MESSAGE }
    }
  },

  async summarize(req: SummarizeRequest): Promise<SummarizeResponse> {
    try {
      return await post<SummarizeResponse>('/api/ai/summarize', req)
    } catch {
      return { summary: FALLBACK_MESSAGE }
    }
  },

  async help(req: HelpRequest): Promise<HelpResponse> {
    try {
      return await post<HelpResponse>('/api/ai/help', req)
    } catch {
      return { answer: FALLBACK_MESSAGE }
    }
  },

  async suggestBom(req: BomSuggestRequest): Promise<BomSuggestResponse> {
    try {
      return await post<BomSuggestResponse>('/api/ai/bom-suggest', req)
    } catch {
      return { materials: [] }
    }
  },
}
