import { useParams } from 'react-router-dom'
import { ReportNav } from '../components/ReportNav'
import { BusinessReport } from '../components/BusinessReport'
import { InventoryReport } from '../components/InventoryReport'
import { ProcurementReport } from '../components/ProcurementReport'
import { ForecastReport } from '../components/ForecastReport'
import { SupplierReport } from '../components/SupplierReport'

export function ReportsPage() {
  const { reportType } = useParams<{ reportType: string }>()

  return (
    <div>
      <ReportNav />
      {reportType === 'inventory' && <InventoryReport />}
      {reportType === 'procurement' && <ProcurementReport />}
      {reportType === 'forecast' && <ForecastReport />}
      {reportType === 'supplier' && <SupplierReport />}
      {(reportType === 'business' || !reportType) && <BusinessReport />}
    </div>
  )
}
