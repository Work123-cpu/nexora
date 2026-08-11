import { useState, type FormEvent } from 'react'
import { Camera, Save } from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { Avatar } from '@/shared/ui/Avatar'
import { Badge } from '@/shared/ui/Badge'
import { useToast } from '@/shared/ui/Toast'
import { roleLabel } from '@/shared/lib/permissions'
import { AccountNav } from '../components/AccountNav'

export function ProfilePage() {
  const { session, updateUser } = useAuth()
  const { toast } = useToast()
  const [form, setForm] = useState({
    name: session?.user.name ?? '',
    email: session?.user.email ?? '',
    jobTitle: session?.user.jobTitle ?? '',
    companyName: session?.user.companyName ?? '',
    phone: session?.user.phone ?? '',
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    updateUser(form)
    setIsSaving(false)
    toast({ title: 'Profile updated', description: 'Your changes have been saved.', tone: 'success' })
  }

  if (!session) return null

  return (
    <div>
      <PageHeader title="Account" description="Manage your personal information and preferences." />
      <AccountNav />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center py-8 text-center">
            <div className="relative">
              <Avatar name={form.name} size="lg" className="size-20 text-lg" />
              <button
                type="button"
                className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
                aria-label="Change avatar"
              >
                <Camera className="size-3.5" />
              </button>
            </div>
            <p className="mt-4 text-base font-semibold text-foreground">{form.name}</p>
            <p className="text-sm text-muted-foreground">{form.jobTitle}</p>
            <Badge tone="primary" className="mt-3 capitalize">
              {roleLabel(session.role)}
            </Badge>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription className="mt-1">Update your name, contact details, and company info.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input label="Job title" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Email address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input label="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <Input label="Company name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />

              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={isSaving} leftIcon={<Save className="size-4" />}>
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
