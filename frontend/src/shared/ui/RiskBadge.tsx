import { AlertTriangle, ShieldCheck, ShieldAlert, Info } from 'lucide-react'
import { Badge, type BadgeTone } from './Badge'

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info'

const CONFIG: Record<RiskLevel, { tone: BadgeTone; label: string; icon: typeof AlertTriangle }> = {
  critical: { tone: 'danger', label: 'Critical', icon: ShieldAlert },
  high: { tone: 'danger', label: 'High Risk', icon: AlertTriangle },
  medium: { tone: 'warning', label: 'Medium Risk', icon: AlertTriangle },
  low: { tone: 'success', label: 'Low Risk', icon: ShieldCheck },
  info: { tone: 'info', label: 'Info', icon: Info },
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const { tone, label, icon: Icon } = CONFIG[level]
  return (
    <Badge tone={tone}>
      <Icon className="size-3" />
      {label}
    </Badge>
  )
}
