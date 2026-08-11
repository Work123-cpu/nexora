import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Lock } from 'lucide-react'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setIsLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success-soft text-success">
          <CheckCircle2 className="size-7" />
        </div>
        <h1 className="mt-5 text-xl font-bold text-foreground">Password reset</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your password has been updated. You can now sign in.</p>
        <Button className="mt-6 w-full" size="lg" onClick={() => navigate('/login')}>
          Back to login
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Set a new password</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Choose a strong password you haven't used before.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          leftIcon={<Lock className="size-4" />}
        />
        <Input
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          leftIcon={<Lock className="size-4" />}
          error={error ?? undefined}
        />
        <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
          Reset password
        </Button>
      </form>

      <Link to="/login" className="mt-6 inline-block text-sm text-muted-foreground hover:text-foreground">
        Back to login
      </Link>
    </motion.div>
  )
}
