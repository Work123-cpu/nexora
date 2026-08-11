export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  context?: Record<string, unknown>
}

export interface ChatResponse {
  message: ChatMessage
  suggestedFollowUps?: string[]
}

export interface ExplainRequest {
  subject: string
  data: Record<string, unknown>
}

export interface ExplainResponse {
  explanation: string
}

export interface SummarizeRequest {
  subject: string
  data: Record<string, unknown>
}

export interface SummarizeResponse {
  summary: string
}

export interface HelpRequest {
  section: string
  question?: string
}

export interface HelpResponse {
  answer: string
  relatedArticles?: string[]
}
