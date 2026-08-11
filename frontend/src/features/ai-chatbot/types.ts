import type { ChatMessage } from '@/services/ai/types'

export interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
  updatedAt: string
}
