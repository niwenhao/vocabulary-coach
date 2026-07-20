import { useState } from 'react'
import { Word } from '../types'
import { deleteWord } from '../db/db'
import WordForm from './WordForm'

interface Props {
  words: Word[]
  onRefresh: () => void
}

export default function WordTable({ words, onRefresh }: Props) {
  const [editWord, setEditWord] = useState<Word | null>(null)
  const [showForm, setShowForm] = useState(false)

  async function handleDelete(word: Word) {
    if (!confirm(`「${word.english}」を削除しますか？`)) return
    await deleteWord(word.id)
    onRefresh()
  }

  function handleEdit(word: Word) {
    setEditWord(word)
    setShowForm(true)
  }

  function handleAdd() {
    setEditWord(null)
    setShowForm(true)
  }

  if (words.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">📭</p>
        <p className="text-lg">単語がありません</p>
        <p className="text-sm mt-1">「単語を追加」またはCSVからインポートしてください</p>
        <button
          onClick={handleAdd}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          単語を追加
        </button>
        {showForm && (
          <WordForm word={editWord} onClose={() => setShowForm(false)} onSaved={onRefresh} />
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          ＋ 単語を追加
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">英語</th>
              <th className="px-4 py-3 text-left">IPA</th>
              <th className="px-4 py-3 text-left">日本語</th>
              <th className="px-4 py-3 text-left">ラベル</th>
              <th className="px-4 py-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {words.map((w) => (
              <tr key={w.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{w.english}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{w.ipa}</td>
                <td className="px-4 py-3 text-gray-700">{w.japanese}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {w.labels.map((l) => (
                      <span key={l} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs">
                        {l}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(w)}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(w)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <WordForm word={editWord} onClose={() => setShowForm(false)} onSaved={onRefresh} />
      )}
    </>
  )
}
