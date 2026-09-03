import { useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ReportNav } from '../components/ReportNav'
import { BusinessReport } from '../components/BusinessReport'
import { InventoryReport } from '../components/InventoryReport'
import { ProcurementReport } from '../components/ProcurementReport'
import { ForecastReport } from '../components/ForecastReport'
import { SupplierReport } from '../components/SupplierReport'

export function ReportsPage() {
  const { reportType } = useParams<{ reportType: string }>()
  const activeReport = reportType ?? 'business'

  return (
    <div>
      <ReportNav />
      <AnimatePresence mode="wait">
        <motion.div
          key={activeReport}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {activeReport === 'inventory' && <InventoryReport />}
          {activeReport === 'procurement' && <ProcurementReport />}
          {activeReport === 'forecast' && <ForecastReport />}
          {activeReport === 'supplier' && <SupplierReport />}
          {activeReport === 'business' && <BusinessReport />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
