import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Sparkles } from 'lucide-react'
import { Dialog } from '@/shared/ui/Dialog'
import { aiService } from '@/services/ai'

interface ExplainState {
  open: boolean
  loading: boolean
  title: string
  explanation: string
}

/** Shared "Ask AI to explain" flow. Previously every call site crammed the explanation into a
 * toast — 4.5s auto-dismiss, capped at a 384px-wide box — which looked broken for anything
 * longer than a sentence. This opens a proper dialog instead: stays open until dismissed, full
 * reading width, and renders markdown (paragraphs/lists) instead of one run-on block of text. */
export function useExplainDialog() {
  const [state, setState] = useState<ExplainState>({ open: false, loading: false, title: '', explanation: '' })

  const explain = async (subject: string, data: Record<string, unknown> = {}) => {
    setState({ open: true, loading: true, title: subject, explanation: '' })
    try {
      const res = await aiService.explain({ subject, data })
      setState({ open: true, loading: false, title: subject, explanation: res.explanation })
    } catch {
      setState({ open: true, loading: false, title: subject, explanation: "Couldn't get an explanation right now — try again in a moment." })
    }
  }

  const close = () => setState((prev) => ({ ...prev, open: false }))

  const dialog = (
    <Dialog open={state.open} onClose={close} title="Nexora explains" description={state.title} className="max-w-xl">
      {state.loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Sparkles className="size-4 animate-pulse text-primary" /> Thinking…
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto text-sm text-foreground [&_p]:m-0 [&_p+p]:mt-3 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1 [&_strong]:font-semibold">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{state.explanation}</ReactMarkdown>
        </div>
      )}
    </Dialog>
  )

  return { explain, dialog }
}
