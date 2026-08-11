import jsPDF, { GState } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Bill } from '@/types/entities/bill'
import { getCompanyConfig, type CompanyConfig } from '@/shared/lib/companyConfig'
import { formatDate } from '@/shared/lib/formatters'

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 14
const PRIMARY: [number, number, number] = [79, 70, 229]
const INK: [number, number, number] = [30, 32, 46]
const MUTED: [number, number, number] = [110, 114, 130]
const BORDER: [number, number, number] = [225, 227, 233]

interface Logo {
  dataUrl: string
  width: number
  height: number
}

/**
 * jsPDF's built-in fonts (Helvetica/Times/Courier) use WinAnsi encoding, which has no glyph
 * for ₹ (Indian Rupee) or Arabic script (AED) — those render as blank boxes. Rather than
 * embedding a custom Unicode font just for this, fall back to the ISO currency code for the
 * two presets that would break; the others (USD/GBP/EUR/SGD) use symbols WinAnsi does support.
 */
function pdfAmount(value: number, currencyCode: string, locale: string): string {
  if (currencyCode === 'INR') {
    return `Rs. ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`
  }
  if (currencyCode === 'AED') {
    return `AED ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Companies upload logos at whatever resolution they have on hand (a multi-megapixel PNG
 * isn't unusual). Embedding that directly would blow up every invoice PDF to several MB —
 * so it's downscaled through a canvas to a print-sane resolution before jsPDF ever sees it.
 */
async function loadOptimizedLogo(dataUrl: string, maxDim = 480): Promise<Logo | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('logo failed to load'))
      image.src = dataUrl
    })
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
    const width = Math.max(1, Math.round(img.naturalWidth * scale))
    const height = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, width, height)
    return { dataUrl: canvas.toDataURL('image/png'), width, height }
  } catch {
    return null
  }
}

function drawWatermark(doc: jsPDF, logo: Logo | null) {
  if (!logo) return
  const ratio = logo.height / logo.width
  const w = 130
  const h = w * ratio
  doc.saveGraphicsState()
  doc.setGState(new GState({ opacity: 0.06 }))
  doc.addImage(logo.dataUrl, 'PNG', (PAGE_W - w) / 2, (PAGE_H - h) / 2, w, h)
  doc.restoreGraphicsState()
}

function drawCancelledStamp(doc: jsPDF) {
  doc.saveGraphicsState()
  doc.setGState(new GState({ opacity: 0.5 }))
  doc.setTextColor(220, 38, 38)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(52)
  doc.text('CANCELLED', PAGE_W / 2, PAGE_H / 2, { align: 'center', angle: 28 })
  doc.restoreGraphicsState()
}

function drawHeader(doc: jsPDF, company: CompanyConfig, logo: Logo | null, bill: Bill): number {
  let textX = MARGIN
  let logoBottom = MARGIN

  if (logo) {
    const ratio = logo.height / logo.width
    let w = 26
    let h = w * ratio
    if (h > 20) {
      h = 20
      w = h / ratio
    }
    doc.addImage(logo.dataUrl, 'PNG', MARGIN, 14, w, h)
    textX = MARGIN + w + 5
    logoBottom = 14 + h
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...INK)
  doc.text(company.name || 'Your Company', textX, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...MUTED)
  let lineY = 25.5
  if (company.address) {
    doc.text(company.address, textX, lineY, { maxWidth: 95 })
    lineY += 4.5
  }
  const contactBits = [company.phone && `Ph: ${company.phone}`, company.email].filter(Boolean).join('   •   ')
  if (contactBits) {
    doc.text(contactBits, textX, lineY)
    lineY += 4.5
  }
  if (company.taxId) {
    doc.text(`GSTIN/Tax ID: ${company.taxId}`, textX, lineY)
    lineY += 4.5
  }

  const rightX = PAGE_W - MARGIN
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...PRIMARY)
  doc.text('INVOICE', rightX, 20, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...INK)
  doc.text(`Bill No: ${bill.billNumber}`, rightX, 27, { align: 'right' })
  doc.text(`Date: ${formatDate(bill.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}`, rightX, 32, { align: 'right' })

  const statusColor: [number, number, number] = bill.status === 'completed' ? [22, 163, 74] : [220, 38, 38]
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...statusColor)
  doc.text(bill.status.toUpperCase(), rightX, 37, { align: 'right' })

  const headerBottom = Math.max(lineY, logoBottom, 40)
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.4)
  doc.line(MARGIN, headerBottom + 2, PAGE_W - MARGIN, headerBottom + 2)

  return headerBottom + 8
}

function drawBillTo(doc: jsPDF, bill: Bill, warehouseName: string | undefined, startY: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...MUTED)
  doc.text('BILL TO', MARGIN, startY)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11.5)
  doc.setTextColor(...INK)
  doc.text(bill.customerName, MARGIN, startY + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  let y = startY + 11
  if (bill.customerPhone) {
    doc.text(`Phone: ${bill.customerPhone}`, MARGIN, y)
    y += 4.5
  }
  if (bill.customerEmail) {
    doc.text(`Email: ${bill.customerEmail}`, MARGIN, y)
    y += 4.5
  }

  if (warehouseName) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...MUTED)
    doc.text('BILLED FROM', PAGE_W - MARGIN, startY, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...INK)
    doc.text(warehouseName, PAGE_W - MARGIN, startY + 6, { align: 'right' })
  }

  return Math.max(y, startY + 11) + 6
}

/** Builds the invoice document without saving it — split out so it can be reused for preview/testing. */
export async function buildBillPdfDoc(bill: Bill, warehouseName?: string): Promise<jsPDF> {
  const company = getCompanyConfig()
  const logo = company.logoDataUrl ? await loadOptimizedLogo(company.logoDataUrl) : null
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const amount = (v: number) => pdfAmount(v, company.currencyCode, company.locale)

  drawWatermark(doc, logo)
  const afterHeaderY = drawHeader(doc, company, logo, bill)
  const afterBillToY = drawBillTo(doc, bill, warehouseName, afterHeaderY)

  autoTable(doc, {
    startY: afterBillToY,
    margin: { left: MARGIN, right: MARGIN },
    head: [['#', 'Item', 'Qty', 'Unit', 'Unit Price', 'Amount']],
    body: bill.items.map((item, i) => [
      String(i + 1),
      item.productName,
      String(item.quantity),
      item.unit,
      amount(item.unitPrice),
      amount(item.lineTotal),
    ]),
    styles: { fontSize: 9, cellPadding: 3, textColor: INK, lineColor: BORDER },
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [247, 247, 251] },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      2: { halign: 'right', cellWidth: 16 },
      3: { halign: 'left', cellWidth: 18 },
      4: { halign: 'right', cellWidth: 30 },
      5: { halign: 'right', cellWidth: 32 },
    },
  })

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  const totalsX = PAGE_W - MARGIN - 65
  const totalsValueX = PAGE_W - MARGIN
  let ty = finalY

  const totalsRow = (label: string, value: string, opts?: { bold?: boolean; color?: [number, number, number] }) => {
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal')
    doc.setFontSize(opts?.bold ? 11 : 9.5)
    doc.setTextColor(...(opts?.color ?? (opts?.bold ? INK : MUTED)))
    doc.text(label, totalsX, ty)
    doc.text(value, totalsValueX, ty, { align: 'right' })
    ty += opts?.bold ? 7.5 : 6
  }

  totalsRow('Subtotal', amount(bill.subtotal))
  if (bill.discountAmount > 0) totalsRow(`Discount (${bill.discountPct}%)`, `-${amount(bill.discountAmount)}`)
  if (bill.taxAmount > 0) totalsRow(`Tax (${bill.taxPct}%)`, `+${amount(bill.taxAmount)}`)

  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.line(totalsX, ty - 3.5, totalsValueX, ty - 3.5)

  doc.setFillColor(238, 240, 253)
  doc.roundedRect(totalsX - 4, ty - 2, totalsValueX - totalsX + 4, 10, 1.5, 1.5, 'F')
  totalsRow('Total', amount(bill.totalAmount), { bold: true, color: PRIMARY })

  if (bill.status === 'cancelled') drawCancelledStamp(doc)

  const pageCount = doc.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, PAGE_H - 20, PAGE_W - MARGIN, PAGE_H - 20)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8.5)
    doc.setTextColor(...MUTED)
    doc.text('Thank you for your business!', PAGE_W / 2, PAGE_H - 14, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.text('This is a computer-generated invoice and does not require a signature.', PAGE_W / 2, PAGE_H - 10, { align: 'center' })
    if (pageCount > 1) {
      doc.text(`Page ${p} of ${pageCount}`, PAGE_W - MARGIN, PAGE_H - 10, { align: 'right' })
    }
  }

  return doc
}

export async function generateBillPdf(bill: Bill, warehouseName?: string): Promise<void> {
  const doc = await buildBillPdfDoc(bill, warehouseName)
  doc.save(`${bill.billNumber}.pdf`)
}
