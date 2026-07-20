import Papa from 'papaparse'
import * as XLSX from 'xlsx'
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

export async function importFromExcel(
  file: File
): Promise<{ inserted: number; updated: number; errors: string[] }> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })

        let inserted = 0
        let updated = 0
        const errors: string[] = []

        for (const row of rows) {
          const english = String(row['english'] ?? '').trim()
          if (!english) {
            errors.push(`Skipped row: missing "english" field`)
            continue
          }
          try {
            const labelsRaw = String(row['labels'] ?? '').trim()
            const labels = labelsRaw
              ? labelsRaw.split(';').map((l) => l.trim()).filter(Boolean)
              : []
            const { action } = await upsertWord({
              english,
              ipa: String(row['ipa'] ?? '').trim(),
              japanese: String(row['japanese'] ?? '').trim(),
              labels,
            })
            if (action === 'inserted') inserted++
            else updated++
          } catch (err) {
            errors.push(`Error importing "${english}": ${String(err)}`)
          }
        }
        resolve({ inserted, updated, errors })
      } catch (err) {
        resolve({ inserted: 0, updated: 0, errors: [String(err)] })
      }
    }
    reader.onerror = () => resolve({ inserted: 0, updated: 0, errors: ['ファイルの読み込みに失敗しました'] })
    reader.readAsArrayBuffer(file)
  })
}

export async function exportToExcel(): Promise<void> {
  const words = await getAllWords()
  const rows = words.map((w: Word) => ({
    english: w.english,
    ipa: w.ipa,
    japanese: w.japanese,
    labels: w.labels.join(';'),
  }))

  const sheet = XLSX.utils.json_to_sheet(rows, { header: ['english', 'ipa', 'japanese', 'labels'] })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Words')
  XLSX.writeFile(workbook, 'vocabular-coach.xlsx')
}
