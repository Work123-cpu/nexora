/** Pure CSV-string builder, split out from exportToCsv so exportManyAsCsvZip (bundling several
 * differently-shaped entity lists into one ZIP) can reuse the exact same escaping/formatting
 * without triggering a download itself. */
export function toCsv(rows: object[]): string {
  const records = rows as Record<string, unknown>[]
  const headers = Object.keys(records[0]!)
  const escape = (value: unknown) => {
    const str = String(value ?? '')
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
  }
  return [headers.join(','), ...records.map((row) => headers.map((h) => escape(row[h])).join(','))].join('\n')
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportToCsv(filename: string, rows: object[]): void {
  if (rows.length === 0) return
  downloadBlob(filename.endsWith('.csv') ? filename : `${filename}.csv`, new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' }))
}
