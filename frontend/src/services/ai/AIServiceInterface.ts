import type {
  ChatRequest,
  ChatResponse,
  ExplainRequest,
  ExplainResponse,
  HelpRequest,
  HelpResponse,
  SummarizeRequest,
  SummarizeResponse,
} from './types'

/**
 * Every AI-driven surface (chatbot, action center, health check, setup wizard)
 * talks only to this contract. Swapping the mock adapter for `httpAIAdapter`
 * (which calls the FastAPI /api/ai/* endpoints) is a one-line change in
 * `aiServiceFactory.ts` — no consumer code changes.
 */
export interface IAIService {
  chat(req: ChatRequest): Promise<ChatResponse>
  explain(req: ExplainRequest): Promise<ExplainResponse>
  summarize(req: SummarizeRequest): Promise<SummarizeResponse>
  help(req: HelpRequest): Promise<HelpResponse>
}
