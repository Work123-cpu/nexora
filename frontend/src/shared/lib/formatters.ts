import { getCompanyConfig } from './companyConfig'

function locale(): string {
  return getCompanyConfig().locale
}

function currencyCode(): string {
  return getCompanyConfig().currencyCode
}

export function formatCurrency(value: number, precise = false): string {
  return new Intl.NumberFormat(locale(), {
    style: 'currency',
    currency: currencyCode(),
    maximumFractionDigits: precise ? 2 : 0,
  }).format(value)
}

/** Compact currency notation — e.g. ₹1.2L (lakh) under en-IN, $1.2M under en-US — driven by the active company locale. */
export function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat(locale(), {
    style: 'currency',
    currency: currencyCode(),
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(locale()).format(value)
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`
}

export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleDateString(locale(), options ?? { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleString(locale(), {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatRelativeTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const diffMs = date.getTime() - Date.now()
  const diffSec = Math.round(diffMs / 1000)
  const abs = Math.abs(diffSec)

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ]

  const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' })

  for (const [unit, secondsInUnit] of units) {
    if (abs >= secondsInUnit) {
      return rtf.format(Math.round(diffSec / secondsInUnit), unit)
    }
  }
  return rtf.format(diffSec, 'second')
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1)}…`
}
