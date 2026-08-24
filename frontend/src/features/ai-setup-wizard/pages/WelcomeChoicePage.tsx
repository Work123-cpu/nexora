import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, PartyPopper, Rocket } from 'lucide-react'
import { KineticHeading } from '@/shared/ui/motion/KineticHeading'
import { useAuth } from '@/features/auth/context/AuthContext'
import { WIZARD_STEP_KEY, WIZARD_DATA_KEY } from '../context/WizardContext'

/**
 * Shown once, right after registration, instead of forcing straight into the Setup Wizard.
 * Lets a brand-new user choose to configure their workspace now or explore the (empty) app
 * first and come back to onboarding later from the sidebar's "Continue AI Setup" link.
 */
export function WelcomeChoicePage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const firstName = session?.user.name.split(' ')[0] ?? 'there'

  return (
    <div className="flex flex-col items-center py-10 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.7, bounce: 0.45 }}
        className="flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent text-white"
      >
        <PartyPopper className="size-10" />
      </motion.div>

      <h1 className="mt-6 text-2xl font-bold text-foreground sm:text-3xl">
        <KineticHeading as="span" delay={0.25}>{`Welcome to Nexora, ${firstName}.`}</KineticHeading>
      </h1>
      <motion.p
        className="mt-2 max-w-md text-sm text-muted-foreground"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        Your workspace is empty and ready. Set it up now with your real products, materials, and
        vendors — or explore first and come back to this anytime from the sidebar.
      </motion.p>

      <motion.div
        className="mt-8 grid w-full max-w-lg gap-4 sm:grid-cols-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.85 }}
      >
        <button
          type="button"
          onClick={() => {
            // Always start a brand-new company's wizard at Welcome — these keys aren't scoped
            // per-company, so a previously completed wizard (this browser's or another
            // account's) would otherwise make setup resume mid-flow or on the finish screen.
            localStorage.removeItem(WIZARD_STEP_KEY)
            localStorage.removeItem(WIZARD_DATA_KEY)
            navigate('/setup')
          }}
          className="group flex flex-col items-start gap-3 rounded-2xl border-2 border-primary bg-primary-soft p-5 text-left transition-transform hover:-translate-y-0.5"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
            <Rocket className="size-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Set up my workspace</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add your company, warehouses, products, and suppliers — about 3 minutes.
            </p>
          </div>
          <span className="mt-1 flex items-center gap-1 text-xs font-medium text-primary">
            Start setup <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/app')}
          className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-5 text-left transition-transform hover:-translate-y-0.5 hover:border-border-strong"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-surface-elevated text-muted-foreground">
            <ArrowRight className="size-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Explore first</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Poke around the empty dashboard. You can run setup later from the sidebar.
            </p>
          </div>
          <span className="mt-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
            Go to Command Center <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      </motion.div>
    </div>
  )
}
