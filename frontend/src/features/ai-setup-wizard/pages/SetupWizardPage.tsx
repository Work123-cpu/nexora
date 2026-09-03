import { Stepper } from '@/shared/ui/Stepper'
import { WizardProvider, WIZARD_STEPS, useWizard } from '../context/WizardContext'
import { WelcomeStep, CompanyStep, WarehouseStep } from '../steps/IntroSteps'
import { ProductsStep, RawMaterialsStep, BOMStep, InventoryStep } from '../steps/DataSteps'
import { SuppliersStep, CalendarStep } from '../steps/IntegrationSteps'
import { ReviewStep, CompletionStep } from '../steps/FinalSteps'

const STEP_COMPONENTS = [
  WelcomeStep,
  CompanyStep,
  WarehouseStep,
  ProductsStep,
  RawMaterialsStep,
  BOMStep,
  InventoryStep,
  SuppliersStep,
  CalendarStep,
  ReviewStep,
  CompletionStep,
]

function WizardContent() {
  const { step } = useWizard()
  const StepComponent = STEP_COMPONENTS[step] ?? WelcomeStep
  const isFinalStep = step === WIZARD_STEPS.length - 1

  return (
    <div>
      {!isFinalStep && (
        <div className="mb-8 overflow-x-auto pb-2">
          <Stepper steps={WIZARD_STEPS.map((label) => ({ label }))} currentStep={step} />
        </div>
      )}
      <StepComponent />
    </div>
  )
}

export function SetupWizardPage() {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  )
}
