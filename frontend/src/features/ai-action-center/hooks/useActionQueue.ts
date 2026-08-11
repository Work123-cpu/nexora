import { useMemo } from 'react'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import { useAllRecommendations } from '@/shared/hooks/useRecommendations'

export type ActionDecision = 'approved' | 'dismissed'

export function useActionQueue() {
  const [decisions, setDecisions] = useLocalStorage<Record<string, ActionDecision>>('Nexora.action-queue', {})
  const { recommendations } = useAllRecommendations()

  const pending = useMemo(() => recommendations.filter((r) => !decisions[r.id]), [recommendations, decisions])
  const approved = useMemo(() => recommendations.filter((r) => decisions[r.id] === 'approved'), [recommendations, decisions])
  const dismissed = useMemo(() => recommendations.filter((r) => decisions[r.id] === 'dismissed'), [recommendations, decisions])

  const decide = (id: string, decision: ActionDecision) => setDecisions((prev) => ({ ...prev, [id]: decision }))
  const resetQueue = () => setDecisions({})

  return { pending, approved, dismissed, decide, resetQueue }
}
