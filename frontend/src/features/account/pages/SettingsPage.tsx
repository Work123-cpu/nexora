import { useRef, useState } from 'react'
import { AlertTriangle, Bot, Building2, Download, LogOut, Moon, Palette, Radio, RefreshCw, Sun, Monitor, Trash2, Upload } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card'
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
import { isDesktopApp, getDesktopBridge } from '@/shared/lib/electronBridge'
import { apiClient } from '@/shared/lib/apiClient'
import { exportManyAsCsvZip } from '@/shared/lib/exportZip'
import { fetchCompanyExport } from '../services/companyExportService'
import { AccountNav } from '../components/AccountNav'

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function SettingsPage() {
  const { mode, setMode } = useTheme()
  const { logout, session } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [company, setCompany] = useState(() => getCompanyConfig())
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [groqKey, setGroqKey] = useState('')
  const [isSavingGroqKey, setIsSavingGroqKey] = useState(false)
  const [groqKeySaved, setGroqKeySaved] = useState(false)
  const [isRelaunching, setIsRelaunching] = useState(false)

  const isAdmin = session?.role === 'admin'
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [hasExported, setHasExported] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setHasExported(false)
    setConfirmName('')
    setDeletePassword('')
    setDeleteError(null)
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const data = await fetchCompanyExport()
      const dateStamp = new Date().toISOString().slice(0, 10)
      await exportManyAsCsvZip(`${company.name || 'nexora-company'}-export-${dateStamp}`, data)
      setHasExported(true)
      toast({ title: 'Export downloaded', description: 'A ZIP with one readable CSV per record type — products, materials, vendors, orders, bills, and more.', tone: 'success' })
    } catch {
      toast({ title: 'Export failed', description: 'Could not fetch your company data. Try again before deleting.', tone: 'error' })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteCompany = async () => {
    setDeleteError(null)
    if (!deletePassword) {
      setDeleteError('Enter your password to confirm.')
      return
    }
    setIsDeleting(true)
    try {
      await apiClient.delete('/company', { password: deletePassword })
      logout()
      navigate('/login')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete the company.')
    } finally {
      setIsDeleting(false)
    }
  }

  const currencyPresetValue = `${company.currencyCode}|${company.locale}`

  const handleLogoChange = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => setCompany((prev) => ({ ...prev, logoDataUrl: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const handleSaveCompany = async () => {
    setCompanyConfig(company)
    // Also push the Alpha Vantage key server-side (not a migration — Market Intelligence's live
    // indicator cards keep reading the localStorage copy above, unchanged) so the backend's
    // scheduled job can check for price moves and raise real notifications. Best-effort: a
    // failure here shouldn't block the (already-succeeded) local save.
    try {
      await apiClient.put('/company/settings', {
        alphaVantageApiKey: company.alphaVantageApiKey,
        dataGovInApiKey: company.dataGovInApiKey,
        commodityPriceApiKey: company.commodityPriceApiKey,
      })
    } catch {
      toast({ title: 'Saved locally, but could not sync to the server', description: 'Price-move notifications may use a stale key until this succeeds.', tone: 'warning' })
      return
    }
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
                Powers Market Intelligence's automatic price tracking for your raw materials — metals &amp; energy via
                Alpha Vantage (get a free key, no card required, at{' '}
                <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  alphavantage.co
                </a>
                ), Indian agricultural mandi prices via data.gov.in (get a free key at{' '}
                <a href="https://data.gov.in/user/register" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  data.gov.in
                </a>
                ), and dairy/other commodities like butter via CommodityPriceAPI (7-day free trial, no card required,
                at{' '}
                <a href="https://commoditypriceapi.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  commoditypriceapi.com
                </a>
                ). Materials without a matching key or feed still show an honest AI-estimated trend instead of no
                data at all.
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
            <Input
              label="data.gov.in API key (optional)"
              type="password"
              value={company.dataGovInApiKey}
              onChange={(e) => setCompany({ ...company, dataGovInApiKey: e.target.value })}
              placeholder="Paste your free key here"
              autoComplete="off"
            />
            <Input
              label="CommodityPriceAPI key (optional)"
              type="password"
              value={company.commodityPriceApiKey}
              onChange={(e) => setCompany({ ...company, commodityPriceApiKey: e.target.value })}
              placeholder="Paste your free-trial key here"
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

        {isAdmin && (
          <Card className="border-danger/30">
            <CardHeader>
              <div>
                <CardTitle className="text-danger">Danger Zone</CardTitle>
                <CardDescription className="mt-1">
                  Permanently delete {company.name || 'this company'} — every product, material, vendor, warehouse,
                  purchase order, bill, and record tied to it. This removes every team member's access too, and
                  cannot be undone.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="danger" leftIcon={<Trash2 className="size-4" />} onClick={() => setDeleteDialogOpen(true)}>
                Delete company
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        title="Delete this company"
        description="This is permanent — there is no undo."
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              Deleting <strong>{company.name || 'this company'}</strong> removes every product, raw material, BOM,
              vendor, warehouse, purchase order, bill, inventory record, and team member's access — permanently.
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">1. Export your data first</p>
            <Button
              type="button"
              variant={hasExported ? 'secondary' : 'outline'}
              size="sm"
              leftIcon={<Download className="size-3.5" />}
              onClick={handleExportData}
              isLoading={isExporting}
            >
              {hasExported ? 'Exported — download again' : 'Export all company data'}
            </Button>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              2. Type <strong>{company.name || 'the company name'}</strong> to confirm
            </p>
            <Input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} placeholder={company.name || 'Company name'} disabled={!hasExported} />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">3. Enter your password</p>
            <Input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="••••••••"
              disabled={!hasExported}
              error={deleteError ?? undefined}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              leftIcon={<Trash2 className="size-4" />}
              disabled={!hasExported || confirmName !== (company.name || '') || !confirmName}
              isLoading={isDeleting}
              onClick={handleDeleteCompany}
            >
              Permanently delete
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
