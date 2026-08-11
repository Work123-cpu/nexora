import { useMemo } from 'react'
import { useTheme } from './ThemeProvider'

export interface ChartPalette {
  grid: string
  axis: string
  tooltipBg: string
  tooltipBorder: string
  tooltipText: string
  series: string[]
  success: string
  warning: string
  danger: string
  info: string
  primary: string
  muted: string
}

const LIGHT_PALETTE: ChartPalette = {
  grid: '#e2e8f0',
  axis: '#64748b',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e2e8f0',
  tooltipText: '#0f172a',
  series: ['#4f46e5', '#0891b2', '#d97706', '#16a34a', '#db2777', '#7c3aed', '#0ea5e9'],
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#2563eb',
  primary: '#4f46e5',
  muted: '#94a3b8',
}

const DARK_PALETTE: ChartPalette = {
  grid: '#222738',
  axis: '#94a3b8',
  tooltipBg: '#15182280',
  tooltipBorder: '#30364a',
  tooltipText: '#f1f5f9',
  series: ['#818cf8', '#22d3ee', '#fbbf24', '#4ade80', '#f472b6', '#a78bfa', '#38bdf8'],
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#f87171',
  info: '#60a5fa',
  primary: '#818cf8',
  muted: '#64748b',
}

export function useChartPalette(): ChartPalette {
  const { resolvedTheme } = useTheme()
  return useMemo(() => (resolvedTheme === 'dark' ? DARK_PALETTE : LIGHT_PALETTE), [resolvedTheme])
}
