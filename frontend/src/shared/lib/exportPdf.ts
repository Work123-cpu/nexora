import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getCompanyConfig } from './companyConfig'
import { formatDateTime } from './formatters'

function titleCase(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())
}

export function exportToPdf(filename: string, rows: object[], reportTitle?: string): void {
  if (rows.length === 0) return
  const records = rows as Record<string, unknown>[]
  const headers = Object.keys(records[0]!)
  const company = getCompanyConfig()

  const doc = new jsPDF({ orientation: headers.length > 5 ? 'landscape' : 'portrait' })

  doc.setFontSize(14)
  doc.text(company.name, 14, 16)
  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(reportTitle ?? filename, 14, 23)
  doc.setFontSize(9)
  doc.text(`Generated ${formatDateTime(new Date())}`, 14, 29)

  autoTable(doc, {
    startY: 34,
    head: [headers.map(titleCase)],
    body: records.map((row) => headers.map((h) => String(row[h] ?? ''))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [79, 70, 229] },
  })

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}
