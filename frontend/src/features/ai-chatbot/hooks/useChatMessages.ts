import { useCallback, useState } from 'react'
import { aiService } from '@/services/ai'
import type { ChatMessage } from '@/services/ai/types'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi, I'm Nexora — your virtual procurement assistant. Ask me about inventory, purchase orders, suppliers, or anything else on this platform.",
  createdAt: new Date().toISOString(),
}

export function useChatMessages() {
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('Nexora.chat-history', [WELCOME_MESSAGE])
  const [isTyping, setIsTyping] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([
    'What should I reorder this week?',
    'Explain my business health score',
    'Which supplier has the best lead time?',
  ])

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      }
      const nextMessages = [...messages, userMessage]
      setMessages(nextMessages)
      setIsTyping(true)
      try {
        const response = await aiService.chat({ messages: nextMessages })
        setMessages([...nextMessages, response.message])
        if (response.suggestedFollowUps) setSuggestions(response.suggestedFollowUps)
      } catch {
        setMessages([
          ...nextMessages,
          {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: "Something went wrong sending that. Please try again — if it keeps happening, the AI service may not be running.",
            createdAt: new Date().toISOString(),
          },
        ])
      } finally {
        setIsTyping(false)
      }
    },
    [messages, setMessages],
  )

  const clearHistory = useCallback(() => setMessages([WELCOME_MESSAGE]), [setMessages])

  return { messages, sendMessage, isTyping, suggestions, clearHistory }
}
