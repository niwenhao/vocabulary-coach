import { useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useWords, useAllLabels } from '../hooks/useWords'
import LabelFilter from '../components/LabelFilter'
import WordTable from '../components/WordTable'
import { importFromCSV, exportToCSV } from '../lib/csv'
import { resetReviewsByWordIds } from '../db/db'

export default function Home() {
  const { activeLabels } = useAppStore()
  const { words, loading, refresh } = useWords(activeLabels)
  const { labels, refresh: refreshLabels } = useAllLabels()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [filterText, setFilterText] = useState('')

  const filteredWords = words.filter(w =>
    w.english.toLowerCase().includes(filterText.toLowerCase())
  )

  async function handleReset() {
    if (filteredWords.length === 0) return
    if (!confirm(`表示中の ${filteredWords.length} 件の学習進捗をリセットしますか？`)) return
    await resetReviewsByWordIds(filteredWords.map(w => w.id))
    await refresh()
  }

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
            onClick={handleReset}
            className="px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            進捗リセット
          </button>
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

      <input
        type="text"
        value={filterText}
        onChange={e => setFilterText(e.target.value)}
        placeholder="英単語で絞り込み..."
        className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />

      {loading ? (
        <div className="text-center py-12 text-gray-400">読み込み中...</div>
      ) : (
        <WordTable words={filteredWords} onRefresh={async () => { await refresh(); await refreshLabels() }} />
      )}
    </div>
  )
}
