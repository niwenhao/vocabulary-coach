import Papa from 'papaparse'
import { upsertWord, getAllWords } from '../db/db'
import { Word } from '../types'

interface CsvRow {
  english: string
  ipa: string
  japanese: string
  labels: string
}

export async function importFromCSV(
  file: File
): Promise<{ inserted: number; updated: number; errors: string[] }> {
  return new Promise((resolve) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let inserted = 0
        let updated = 0
        const errors: string[] = []

        for (const row of results.data) {
          if (!row.english?.trim()) {
            errors.push(`Skipped row: missing "english" field`)
            continue
          }
          try {
            const labels = row.labels
              ? row.labels.split(';').map((l) => l.trim()).filter(Boolean)
              : []
            const { action } = await upsertWord({
              english: row.english.trim(),
              ipa: row.ipa?.trim() ?? '',
              japanese: row.japanese?.trim() ?? '',
              labels,
            })
            if (action === 'inserted') inserted++
            else updated++
          } catch (e) {
            errors.push(`Error importing "${row.english}": ${String(e)}`)
          }
        }
        resolve({ inserted, updated, errors })
      },
      error: (err) => {
        resolve({ inserted: 0, updated: 0, errors: [err.message] })
      },
    })
  })
}

export async function exportToCSV(): Promise<void> {
  const words = await getAllWords()
  const rows = words.map((w: Word) => ({
    english: w.english,
    ipa: w.ipa,
    japanese: w.japanese,
    labels: w.labels.join(';'),
  }))

  const csv = Papa.unparse(rows, { columns: ['english', 'ipa', 'japanese', 'labels'] })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'vocabular-coach.csv'
  a.click()
  URL.revokeObjectURL(url)
}
