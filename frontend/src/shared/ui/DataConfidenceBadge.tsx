import { Badge, type BadgeTone } from './Badge'
import type { ConfidenceLevel } from '@/types/entities/materialIntelligence'

const TONE: Record<ConfidenceLevel, BadgeTone> = { high: 'success', medium: 'info', low: 'warning' }
const LABEL: Record<ConfidenceLevel, string> = { high: 'High', medium: 'Medium', low: 'Low' }

/** Qualitative "Data confidence: High/Medium/Low" label — distinct from ConfidenceScoreBadge's
 * numeric 0-100% score (used for the price forecast), since the backend produces a categorical
 * level here, not a percentage. */
export function DataConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return <Badge tone={TONE[level]}>Data confidence: {LABEL[level]}</Badge>
}
