import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/DropdownMenu'
import { useToast } from '@/shared/ui/Toast'
import { exportToCsv } from '@/shared/lib/exportCsv'
import { exportToPdf } from '@/shared/lib/exportPdf'

interface ExportMenuProps {
  filename: string
  rows: object[]
  title?: string
}

export function ExportMenu({ filename, rows, title }: ExportMenuProps) {
  const { toast } = useToast()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline" leftIcon={<Download className="size-4" />}>
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() => {
            exportToCsv(filename, rows)
            toast({ title: 'Export complete', description: `${filename}.csv has been downloaded.`, tone: 'success' })
          }}
        >
          <FileSpreadsheet className="size-4" /> Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            if (rows.length === 0) {
              toast({ title: 'Nothing to export', description: 'This report has no rows yet.', tone: 'warning' })
              return
            }
            exportToPdf(filename, rows, title)
            toast({ title: 'Export complete', description: `${filename}.pdf has been downloaded.`, tone: 'success' })
          }}
        >
          <FileText className="size-4" /> Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
