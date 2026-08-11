import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Boxes, Truck } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/Card'
import { Select } from '@/shared/ui/Select'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { vendors } from '@/mocks/seed/vendors.seed'
import { useVendorAuth } from '../context/VendorAuthContext'

export function VendorLoginPage() {
  const { isAuthenticated, login } = useVendorAuth()
  const navigate = useNavigate()
  const [vendorId, setVendorId] = useState(vendors[0]?.id ?? '')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/vendor-portal" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await login(vendorId, password)
    setIsSubmitting(false)
    navigate('/vendor-portal')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6 py-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
              <Truck className="size-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Nexora Vendor Portal</h1>
              <p className="mt-1 text-sm text-muted-foreground">See and act on purchase orders raised against you.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Your company"
              options={vendors.map((v) => ({ label: v.name, value: v.id }))}
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
            />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Sign in
            </Button>
          </form>

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Boxes className="size-3.5" /> Demo environment — any password signs you in as the selected vendor.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
