import { useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Download, Upload } from 'lucide-react'
import { Dialog } from './Dialog'
import { Button } from './Button'
import { parseCsv, downloadCsvTemplate } from '@/shared/lib/csv'

interface ParsedRow<TInput> {
  index: number
  raw: Record<string, string>
  input?: TInput
  error?: string
}

interface BulkImportDialogProps<TInput> {
  open: boolean
  onClose: () => void
  title: string
  description: string
  templateFilename: string
  templateHeaders: string[]
  templateExampleRow: string[]
  mapRow: (row: Record<string, string>) => { input: TInput } | { error: string }
  onImportRow: (input: TInput) => Promise<unknown>
  onImported: (successCount: number) => void
}

/** Generic CSV bulk-import flow: pick a file, preview + validate every row, then commit only the valid ones. */
export function BulkImportDialog<TInput>({
  open,
  onClose,
  title,
  description,
  templateFilename,
  templateHeaders,
  templateExampleRow,
  mapRow,
  onImportRow,
  onImported,
}: BulkImportDialogProps<TInput>) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow<TInput>[]>([])
  const [fileName, setFileName] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const reset = () => {
    setRows([])
    setFileName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFile = async (file: File) => {
    setFileName(file.name)
    const text = await file.text()
    const parsed = parseCsv(text)
    setRows(
      parsed.map((raw, index) => {
        const result = mapRow(raw)
        return 'error' in result ? { index, raw, error: result.error } : { index, raw, input: result.input }
      }),
    )
  }

  const validRows = rows.filter((r) => r.input !== undefined)
  const errorRows = rows.filter((r) => r.error !== undefined)

  const handleImport = async () => {
    setIsImporting(true)
    let successCount = 0
    for (const row of validRows) {
      try {
        await onImportRow(row.input as TInput)
        successCount++
      } catch {
        // per-row failure doesn't abort the batch — surfaced via the final count
      }
    }
    setIsImporting(false)
    onImported(successCount)
    handleClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={title}
      description={description}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} isLoading={isImporting} disabled={validRows.length === 0} leftIcon={<Upload className="size-4" />}>
            Import {validRows.length > 0 ? `${validRows.length} valid row${validRows.length === 1 ? '' : 's'}` : 'rows'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => downloadCsvTemplate(templateFilename, templateHeaders, templateExampleRow)}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Download className="size-3.5" /> Download CSV template
        </button>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          <Button type="button" variant="outline" leftIcon={<Upload className="size-4" />} onClick={() => fileInputRef.current?.click()}>
            {fileName || 'Choose CSV file'}
          </Button>
        </div>

        {rows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 className="size-3.5" /> {validRows.length} valid
              </span>
              {errorRows.length > 0 && (
                <span className="flex items-center gap-1 text-danger">
                  <AlertCircle className="size-3.5" /> {errorRows.length} with errors
                </span>
              )}
            </div>
            <div className="max-h-56 overflow-y-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.index} className="border-b border-border last:border-0">
                      <td className="w-8 px-3 py-2 text-muted-foreground">{row.index + 1}</td>
                      <td className="px-3 py-2 text-foreground">{Object.values(row.raw).slice(0, 3).join(' · ')}</td>
                      <td className="px-3 py-2 text-right">
                        {row.error ? <span className="text-danger">{row.error}</span> : <span className="text-success">OK</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}
