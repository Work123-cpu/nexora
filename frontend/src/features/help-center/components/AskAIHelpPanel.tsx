import { useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { aiService } from '@/services/ai'

export function AskAIHelpPanel() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAsk = async () => {
    if (!question.trim()) return
    setIsLoading(true)
    const res = await aiService.help({ section: 'general', question })
    setAnswer(res.answer)
    setIsLoading(false)
  }

  return (
    <Card className="border-primary/30 bg-primary-soft/30">
      <CardContent>
        <div className="flex items-center gap-2">
          <Sparkles className="size-4.5 text-primary" />
          <p className="text-sm font-semibold text-foreground">Ask Nexora</p>
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="e.g. How do reorder points work?"
            leftIcon={<Search className="size-4" />}
            containerClassName="flex-1"
          />
          <Button onClick={handleAsk} isLoading={isLoading}>
            Ask
          </Button>
        </div>
        {answer && <p className="mt-4 rounded-xl bg-surface p-4 text-sm text-muted-foreground">{answer}</p>}
      </CardContent>
    </Card>
  )
}
