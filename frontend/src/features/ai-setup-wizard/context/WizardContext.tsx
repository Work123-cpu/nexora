import { createContext, useContext, type ReactNode } from 'react'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'

export interface WizardData {
  companyName: string
  industry: string
  companySize: string
  billingProvider: string
  acknowledgedCalendar: boolean
  completed: boolean
}

const DEFAULT_DATA: WizardData = {
  companyName: '',
  industry: '',
  companySize: '1-10 employees',
  billingProvider: 'none',
  acknowledgedCalendar: false,
  completed: false,
}

export const WIZARD_STEPS = [
  'Welcome',
  'Company',
  'Warehouses',
  'Products',
  'Raw Materials',
  'Bill of Materials',
  'Inventory',
  'Suppliers',
  'Billing',
  'Business Calendar',
  'Review',
  'Completion',
] as const

interface WizardContextValue {
  step: number
  setStep: (step: number) => void
  data: WizardData
  updateData: (patch: Partial<WizardData>) => void
  next: () => void
  back: () => void
}

const WizardContext = createContext<WizardContextValue | null>(null)

export function WizardProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useLocalStorage('Nexora.wizard-step', 0)
  const [data, setData] = useLocalStorage<WizardData>('Nexora.wizard-data', DEFAULT_DATA)

  const updateData = (patch: Partial<WizardData>) => setData((prev) => ({ ...prev, ...patch }))
  const next = () => setStep((s) => Math.min(WIZARD_STEPS.length - 1, s + 1))
  const back = () => setStep((s) => Math.max(0, s - 1))

  return <WizardContext.Provider value={{ step, setStep, data, updateData, next, back }}>{children}</WizardContext.Provider>
}

export function useWizard() {
  const ctx = useContext(WizardContext)
  if (!ctx) throw new Error('useWizard must be used within WizardProvider')
  return ctx
}
