/**
 * Per-browser company profile (name, logo, currency, locale) — the seam that makes
 * currency/locale formatting configurable per company instead of hardcoded to
 * en-IN/INR. Read synchronously (not via React state) so `formatters.ts`'s plain
 * functions — called from everywhere, not just components — always see the latest
 * value without needing a context provider threaded through the whole app.
 */

export interface CompanyConfig {
  name: string
  logoDataUrl: string | null
  currencyCode: string
  locale: string
  address: string
  phone: string
  email: string
  taxId: string
  /** Free Alpha Vantage key — powers live commodity/fuel prices on Market Intelligence. Optional. */
  alphaVantageApiKey: string
}

const STORAGE_KEY = 'Nexora.company-config'

export const DEFAULT_COMPANY_CONFIG: CompanyConfig = {
  name: 'Annapurna Foods & Beverages Pvt. Ltd.',
  logoDataUrl: null,
  currencyCode: 'INR',
  locale: 'en-IN',
  address: '',
  phone: '',
  email: '',
  taxId: '',
  alphaVantageApiKey: '',
}

export const CURRENCY_LOCALE_PRESETS: { label: string; currencyCode: string; locale: string }[] = [
  { label: 'India — ₹ INR', currencyCode: 'INR', locale: 'en-IN' },
  { label: 'United States — $ USD', currencyCode: 'USD', locale: 'en-US' },
  { label: 'United Kingdom — £ GBP', currencyCode: 'GBP', locale: 'en-GB' },
  { label: 'European Union — € EUR', currencyCode: 'EUR', locale: 'de-DE' },
  { label: 'United Arab Emirates — د.إ AED', currencyCode: 'AED', locale: 'ar-AE' },
  { label: 'Singapore — $ SGD', currencyCode: 'SGD', locale: 'en-SG' },
]

export function getCompanyConfig(): CompanyConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_COMPANY_CONFIG, ...(JSON.parse(raw) as Partial<CompanyConfig>) } : DEFAULT_COMPANY_CONFIG
  } catch {
    return DEFAULT_COMPANY_CONFIG
  }
}

export function setCompanyConfig(config: CompanyConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}
