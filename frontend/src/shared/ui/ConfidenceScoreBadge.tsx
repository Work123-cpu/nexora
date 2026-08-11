import { Badge } from './Badge'

export function ConfidenceScoreBadge({ score }: { score: number }) {
  const tone = score >= 85 ? 'success' : score >= 65 ? 'info' : 'warning'
  return <Badge tone={tone}>{score}% confidence</Badge>
}
