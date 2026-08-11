import { useRef, useState } from 'react'
import { AlertTriangle, Bot, Building2, Globe, LogOut, Moon, Palette, Radio, RefreshCw, Sun, Monitor, Upload } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Switch } from '@/shared/ui/Switch'
import { Select } from '@/shared/ui/Select'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { Avatar } from '@/shared/ui/Avatar'
import { Dialog } from '@/shared/ui/Dialog'
import { useToast } from '@/shared/ui/Toast'
import { useTheme, type ThemeMode } from '@/theme/ThemeProvider'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { CURRENCY_LOCALE_PRESETS, getCompanyConfig, setCompanyConfig } from '@/shared/lib/companyConfig'
import { resetAllMockData } from '@/mocks/resetAllMockData'
import { isDesktopApp, getDesktopBridge } from '@/shared/lib/electronBridge'
import { AccountNav } from '../components/AccountNav'

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

/** Only meaningful against the mock data layer — clearing it does nothing to real MySQL data. */
const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false'

const LANGUAGE_OPTIONS = [
  { label: 'English (US)', value: 'en-US' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
]

export function SettingsPage() {
  const { mode, setMode } = useTheme()
  const { logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [language, setLanguage] = useState('en-US')
  const [notifications, setNotifications] = useState({ email: true, push: true, weeklyDigest: false, criticalAlertsOnly: false })
  const [company, setCompany] = useState(() => getCompanyConfig())
  const [confirmReset, setConfirmReset] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [groqKey, setGroqKey] = useState('')
  const [isSavingGroqKey, setIsSavingGroqKey] = useState(false)
  const [groqKeySaved, setGroqKeySaved] = useState(false)
  const [isRelaunching, setIsRelaunching] = useState(false)

  const currencyPresetValue = `${company.currencyCode}|${company.locale}`

  const handleLogoChange = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => setCompany((prev) => ({ ...prev, logoDataUrl: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const handleSaveCompany = () => {
    setCompanyConfig(company)
    toast({ title: 'Company profile saved', description: 'Currency and locale changes apply immediately across the app.', tone: 'success' })
  }

  const handleSaveGroqKey = async () => {
    const bridge = getDesktopBridge()
    if (!bridge || !groqKey.trim()) return
    setIsSavingGroqKey(true)
    try {
      const result = await bridge.saveGroqKey(groqKey.trim())
      if (result.ok) {
        setGroqKeySaved(true)
        setGroqKey('')
        toast({ title: 'Groq API key saved', description: 'Restart Nexora to start using it.', tone: 'success' })
      } else {
        toast({ title: 'Could not save the key', description: result.message, tone: 'error' })
      }
    } finally {
      setIsSavingGroqKey(false)
    }
  }

  const handleRelaunch = async () => {
    const bridge = getDesktopBridge()
    if (!bridge) return
    setIsRelaunching(true)
    await bridge.relaunch()
  }

  const handleReset = () => {
    resetAllMockData()
    setConfirmReset(false)
    toast({ title: 'Blank slate ready', description: 'All demo business data has been cleared.', tone: 'success' })
    navigate('/setup')
  }

  return (
    <div>
      <PageHeader title="Account" description="Manage your personal information and preferences." />
      <AccountNav />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4" /> Company Profile
              </CardTitle>
              <CardDescription className="mt-1">
                Your company's identity, currency, and locale — used everywhere prices and dates are shown.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={company.name || 'Company'} src={company.logoDataUrl ?? undefined} size="lg" />
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleLogoChange(file)
                  }}
                />
                <Button type="button" variant="outline" size="sm" leftIcon={<Upload className="size-3.5" />} onClick={() => logoInputRef.current?.click()}>
                  Upload logo
                </Button>
                <p className="mt-1.5 text-xs text-muted-foreground">PNG or JPG recommended — appears on bill PDFs.</p>
              </div>
            </div>

            <Input label="Company name" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />

            <Input
              label="Address"
              value={company.address}
              onChange={(e) => setCompany({ ...company, address: e.target.value })}
              placeholder="Street, City, State, PIN"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Phone" value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} placeholder="+91 98765 43210" />
              <Input label="Email" type="email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} placeholder="billing@company.com" />
            </div>

            <Input
              label="Tax ID / GSTIN (optional)"
              value={company.taxId}
              onChange={(e) => setCompany({ ...company, taxId: e.target.value })}
              placeholder="22AAAAA0000A1Z5"
            />

            <Select
              label="Currency & locale"
              options={CURRENCY_LOCALE_PRESETS.map((p) => ({ label: p.label, value: `${p.currencyCode}|${p.locale}` }))}
              value={currencyPresetValue}
              onChange={(e) => {
                const [currencyCode, locale] = e.target.value.split('|')
                setCompany({ ...company, currencyCode: currencyCode!, locale: locale! })
              }}
            />

            <p className="text-xs text-muted-foreground">
              Address, phone, email, and tax ID appear on the letterhead of every bill PDF generated from Billing.
            </p>

            <div className="flex justify-end">
              <Button onClick={handleSaveCompany}>Save company profile</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Radio className="size-4" /> Market Intelligence
              </CardTitle>
              <CardDescription className="mt-1">
                Powers live commodity &amp; fuel prices, matched against your own raw materials. Get a free key (no
                card required) at{' '}
                <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  alphavantage.co
                </a>
                . Currency rates (USD/INR, EUR/INR) are already live with no key needed.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Alpha Vantage API key (optional)"
              type="password"
              value={company.alphaVantageApiKey}
              onChange={(e) => setCompany({ ...company, alphaVantageApiKey: e.target.value })}
              placeholder="Paste your free key here"
              autoComplete="off"
            />
            <div className="flex justify-end">
              <Button onClick={handleSaveCompany}>Save</Button>
            </div>
          </CardContent>
        </Card>

        {isDesktopApp() && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="size-4" /> AI / Groq API Key
                </CardTitle>
                <CardDescription className="mt-1">
                  Powers the AI chat assistant, health-check summaries, and demand forecasting. Get a free key at{' '}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => getDesktopBridge()?.openExternal('https://console.groq.com/keys')}
                  >
                    console.groq.com/keys
                  </button>
                  .
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Groq API key"
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="gsk_••••••••••••••••••••••••"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Saved to this device only — never sent anywhere except directly to Groq when the AI features run.
              </p>

              {groqKeySaved ? (
                <div className="flex items-center justify-between rounded-xl border border-warning/30 bg-warning-soft p-3">
                  <p className="text-sm text-warning">Saved. Restart Nexora for the new key to take effect.</p>
                  <Button size="sm" variant="outline" leftIcon={<RefreshCw className="size-3.5" />} onClick={handleRelaunch} isLoading={isRelaunching}>
                    Restart now
                  </Button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <Button onClick={handleSaveGroqKey} isLoading={isSavingGroqKey} disabled={!groqKey.trim()}>
                    Save key
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="size-4" /> Appearance
              </CardTitle>
              <CardDescription className="mt-1">Choose how Nexora looks on your device.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMode(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors',
                    mode === opt.value ? 'border-primary bg-primary-soft text-primary' : 'border-border text-muted-foreground hover:bg-surface-elevated',
                  )}
                >
                  <opt.icon className="size-5" />
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="size-4" /> Language & Region
              </CardTitle>
              <CardDescription className="mt-1">Set your preferred language for the interface.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Select
              options={LANGUAGE_OPTIONS}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="max-w-xs"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription className="mt-1">Choose what Nexora notifies you about.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Switch
              label="Email notifications"
              description="Receive email updates about important business events."
              checked={notifications.email}
              onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
            />
            <Switch
              label="Push notifications"
              description="Get real-time alerts in your browser."
              checked={notifications.push}
              onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
            />
            <Switch
              label="Weekly digest"
              description="A weekly summary of business health and AI recommendations."
              checked={notifications.weeklyDigest}
              onChange={(e) => setNotifications({ ...notifications, weeklyDigest: e.target.checked })}
            />
            <Switch
              label="Critical alerts only"
              description="Suppress low-priority notifications."
              checked={notifications.criticalAlertsOnly}
              onChange={(e) => setNotifications({ ...notifications, criticalAlertsOnly: e.target.checked })}
            />
          </CardContent>
        </Card>

        {USE_MOCK_BACKEND && (
          <Card className="border-danger/30">
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2 text-danger">
                  <AlertTriangle className="size-4" /> Danger Zone
                </CardTitle>
                <CardDescription className="mt-1">
                  Clear every product, raw material, BOM, warehouse, vendor, and purchase order — for starting fresh as a new company.
                  This cannot be undone.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="danger" onClick={() => setConfirmReset(true)}>
                Reset to blank slate
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-danger/30">
          <CardHeader>
            <div>
              <CardTitle className="text-danger">Session</CardTitle>
              <CardDescription className="mt-1">Sign out of your Nexora account on this device.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              variant="danger"
              leftIcon={<LogOut className="size-4" />}
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset to blank slate"
        description="This action cannot be undone."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReset}>
              Clear everything
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          This permanently clears all products, raw materials, bills of materials, warehouses, vendors, purchase orders, and
          inventory from this browser, then takes you to the Setup Wizard to configure your own company from scratch.
        </p>
      </Dialog>
    </div>
  )
}
