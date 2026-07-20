import { exportToCSV } from '../lib/csv'
import { clearAllData, downloadDB } from '../db/db'

export default function Settings() {
  async function handleClear() {
    if (!confirm('すべての単語・学習履歴を削除しますか？この操作は元に戻せません。')) return
    await clearAllData()
    alert('データを削除しました')
    window.location.reload()
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">設定</h1>

      <section className="bg-white rounded-xl border border-gray-200 divide-y">
        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">バックアップ</h2>
          <p className="text-xs text-gray-500 mb-3">すべての単語をCSVファイルにエクスポートします</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => exportToCSV()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
            >
              CSVエクスポート
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
