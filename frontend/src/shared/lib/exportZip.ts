import JSZip from 'jszip'
import { toCsv, downloadBlob } from './exportCsv'

/** Bundles several entity lists into one ZIP of CSVs. A single flat CSV can't represent them
 * together — products, bills, and calendar events share almost no columns — so this is the
 * readable equivalent of a JSON dump: one properly-columned CSV per entity, one download.
 * Entities with no rows are skipped rather than writing an empty/header-only file. */
export async function exportManyAsCsvZip(zipFilename: string, files: Record<string, object[]>): Promise<void> {
  const zip = new JSZip()
  for (const [name, rows] of Object.entries(files)) {
    if (rows.length === 0) continue
    zip.file(`${name}.csv`, toCsv(rows))
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`, blob)
}
