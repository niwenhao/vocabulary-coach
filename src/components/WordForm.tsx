import { useState, useEffect } from 'react'
import { Word } from '../types'
import { insertWord, updateWord, insertReview } from '../db/db'

interface Props {
  word?: Word | null
  onClose: () => void
  onSaved: () => void
}

export default function WordForm({ word, onClose, onSaved }: Props) {
  const [english, setEnglish] = useState('')
  const [ipa, setIpa] = useState('')
  const [japanese, setJapanese] = useState('')
  const [labelsText, setLabelsText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (word) {
      setEnglish(word.english)
      setIpa(word.ipa)
      setJapanese(word.japanese)
      setLabelsText(word.labels.join(', '))
    }
  }, [word])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!english.trim() || !japanese.trim()) {
      setError('英語と日本語は必須です')
      return
    }
    setSaving(true)
    try {
      const labels = labelsText
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean)
      if (word) {
        await updateWord(word.id, { english: english.trim(), ipa: ipa.trim(), japanese: japanese.trim(), labels })
      } else {
        const id = await insertWord({ english: english.trim(), ipa: ipa.trim(), japanese: japanese.trim(), labels })
        await insertReview(id)
      }
      onSaved()
      onClose()
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{word ? '単語を編集' : '単語を追加'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">英語 *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              placeholder="e.g. ubiquitous"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IPA発音</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={ipa}
              onChange={(e) => setIpa(e.target.value)}
              placeholder="e.g. /juːˈbɪk.wɪ.təs/"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日本語 *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={japanese}
              onChange={(e) => setJapanese(e.target.value)}
              placeholder="e.g. いたるところにある"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ラベル（カンマ区切り）</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={labelsText}
              onChange={(e) => setLabelsText(e.target.value)}
              placeholder="e.g. TOEIC, business"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
