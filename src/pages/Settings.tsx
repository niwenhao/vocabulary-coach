import { useEffect, useState } from 'react'
import { exportToCSV, exportToExcel } from '../lib/csv'
import { clearAllData, downloadDB, getAllLabels } from '../db/db'
import {
  getDefaultTimeLimit,
  setDefaultTimeLimit,
  getLabelTimeLimits,
  setLabelTimeLimit,
} from '../lib/labelSettings'

export default function Settings() {
  const [labels, setLabels] = useState<string[]>([])
  const [defaultLimit, setDefaultLimitState] = useState(0)
  const [labelLimits, setLabelLimitsState] = useState<Record<string, number>>({})

  useEffect(() => {
    getAllLabels().then(setLabels)
    setDefaultLimitState(getDefaultTimeLimit())
    setLabelLimitsState(getLabelTimeLimits())
  }, [])

  function handleDefaultChange(value: string) {
    const secs = Math.max(0, parseInt(value, 10) || 0)
    setDefaultTimeLimit(secs)
    setDefaultLimitState(secs)
  }

  function handleLabelChange(label: string, value: string) {
    const secs = Math.max(0, parseInt(value, 10) || 0)
    setLabelTimeLimit(label, secs)
    setLabelLimitsState((prev) => ({ ...prev, [label]: secs }))
  }

  async function handleClear() {
    if (!confirm('すべての単語・学習履歴を削除しますか？この操作は元に戻せません。')) return
    await clearAllData()
    alert('データを削除しました')
    window.location.reload()
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">設定</h1>

      <section className="bg-white rounded-xl border border-gray-200 divide-y mb-6">
        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">タイピング制限時間（秒）</h2>
          <p className="text-xs text-gray-500 mb-3">
            0は制限なし。ラベル未設定の場合はデフォルト時間を使用。複数ラベル選択時は最長の時間を使用します。
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-28 shrink-0">デフォルト</span>
              <input
                type="number"
                min={0}
                value={defaultLimit || ''}
                onChange={(e) => handleDefaultChange(e.target.value)}
                placeholder="0（無制限）"
                className="w-28 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            {labels.map((label) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-28 shrink-0 truncate">{label}</span>
                <input
                  type="number"
                  min={0}
                  value={labelLimits[label] || ''}
                  onChange={(e) => handleLabelChange(label, e.target.value)}
                  placeholder="デフォルト"
                  className="w-28 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            ))}
            {labels.length === 0 && (
              <p className="text-xs text-gray-400">ラベルがありません</p>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 divide-y">
        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">バックアップ</h2>
          <p className="text-xs text-gray-500 mb-3">すべての単語をファイルにエクスポートします</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => exportToCSV()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
            >
              CSVエクスポート
            </button>
            <button
              onClick={() => exportToExcel()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
            >
              Excelエクスポート
            </button>
            <button
              onClick={() => downloadDB()}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
            >
              DBダウンロード (.db)
            </button>
          </div>
        </div>

        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold text-red-600 mb-1">データ削除</h2>
          <p className="text-xs text-gray-500 mb-3">すべての単語と学習履歴を削除します。操作は元に戻せません。</p>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
          >
            すべて削除
          </button>
        </div>
      </section>

      <section className="mt-6 px-1">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">CSVフォーマット</h2>
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-xs font-mono text-gray-600">
          <p className="mb-1 font-bold text-gray-700">english,ipa,japanese,labels</p>
          <p>ubiquitous,/juːˈbɪk.wɪ.təs/,"いたるところにある",TOEIC;business</p>
          <p>ephemeral,/ɪˈfem.ər.əl/,短命の,literature</p>
        </div>
        <p className="text-xs text-gray-400 mt-2">ラベルはセミコロン（;）で区切ります</p>
      </section>

      <p className="text-center text-xs text-gray-400 mt-8">Vocabular Coach v0.1.0</p>
    </div>
  )
}
