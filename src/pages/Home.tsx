import { useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useWords, useAllLabels } from '../hooks/useWords'
import LabelFilter from '../components/LabelFilter'
import WordTable from '../components/WordTable'
import { importFromCSV, exportToCSV } from '../lib/csv'

export default function Home() {
  const { activeLabels } = useAppStore()
  const { words, loading, refresh } = useWords(activeLabels)
  const { labels, refresh: refreshLabels } = useAllLabels()
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await importFromCSV(file)
    alert(`インポート完了: 追加 ${result.inserted}件、更新 ${result.updated}件${result.errors.length > 0 ? `\nエラー: ${result.errors.join('\n')}` : ''}`)
    e.target.value = ''
    await refresh()
    await refreshLabels()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">単語リスト</h1>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            CSVインポート
          </button>
          <button
            onClick={() => exportToCSV()}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            CSVエクスポート
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>

      <LabelFilter labels={labels} />

      {loading ? (
        <div className="text-center py-12 text-gray-400">読み込み中...</div>
      ) : (
        <WordTable words={words} onRefresh={async () => { await refresh(); await refreshLabels() }} />
      )}
    </div>
  )
}
