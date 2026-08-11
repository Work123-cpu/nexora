/** Minimal CSV parsing/generation — no external dependency for a feature this contained. */

export function parseCsv(text: string): Record<string, string>[] {
  const rows = splitCsvRows(text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')).filter((row) => row.some((cell) => cell.trim() !== ''))
  if (rows.length === 0) return []

  const headers = rows[0]!.map((h) => h.trim())
  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {}
    headers.forEach((header, i) => {
      record[header] = (row[i] ?? '').trim()
    })
    return record
  })
}

function splitCsvRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function downloadCsvTemplate(filename: string, headers: string[], exampleRow: string[]): void {
  const csv = [headers.map(csvEscape).join(','), exampleRow.map(csvEscape).join(',')].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
