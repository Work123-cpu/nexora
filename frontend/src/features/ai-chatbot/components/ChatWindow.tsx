import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Send, Sparkles, Trash2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { IconButton } from '@/shared/ui/IconButton'
import { useChatMessages } from '../hooks/useChatMessages'
import { TypingIndicator } from './TypingIndicator'

export function ChatWindow({ onClose }: { onClose?: () => void }) {
  const { messages, sendMessage, isTyping, suggestions, clearHistory } = useChatMessages()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = (text?: string) => {
    const content = (text ?? input).trim()
    if (!content) return
    setInput('')
    void sendMessage(content)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
            <Sparkles className="size-4.5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Nexora Assistant</p>
            <p className="text-[11px] text-muted-foreground">Always here to help</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <IconButton icon={<Trash2 className="size-4" />} variant="ghost" aria-label="Clear conversation" onClick={clearHistory} />
          {onClose && (
            <IconButton icon={<Send className="size-4 rotate-180" />} variant="ghost" aria-label="Close" onClick={onClose} className="lg:hidden" />
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-surface-elevated text-foreground',
              )}
            >
              {message.role === 'assistant' ? (
                <div className="prose-sm [&_p]:m-0 [&_ul]:my-1 [&_ul]:pl-4">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <TypingIndicator />
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border p-3">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask Nexora anything…"
          className="h-10 flex-1 rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus-ring focus:border-primary"
        />
        <IconButton icon={<Send className="size-4" />} aria-label="Send message" onClick={() => handleSend()} />
      </div>
    </div>
  )
}
