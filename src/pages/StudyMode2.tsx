import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { useAllLabels } from '../hooks/useWords'
import { useAppStore } from '../store/useAppStore'
import LabelFilter from '../components/LabelFilter'
import ProgressBar from '../components/ProgressBar'

type CardState = 'english' | 'ipa' | 'japanese' | 'marked'

export default function StudyMode2() {
  const navigate = useNavigate()
  const { labels } = useAllLabels()
  const { currentWord, isFinished, progress, buildQueue, recordOutcome } = useSession()
  const { resetSession } = useAppStore()

  const [started, setStarted] = useState(false)
  const [cardState, setCardState] = useState<CardState>('english')
  const [practiceMode, setPracticeMode] = useState(false)

  useEffect(() => {
    resetSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setCardState('english')
  }, [currentWord])

  async function handleStart() {
    await buildQueue(2, practiceMode)
    setStarted(true)
  }

  async function handleMark(remembered: boolean) {
    setCardState('marked')
    await recordOutcome(remembered ? 'remembered' : 'forgot', 2, practiceMode)
  }

  function tapCard() {
    if (cardState === 'english') setCardState('ipa')
    else if (cardState === 'ipa') setCardState('japanese')
  }

  if (!started) {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">フラッシュカード</h1>
        <p className="text-gray-500 mb-6">英語→IPA→日本語の順でタップして表示。覚えているか確認します。</p>
        <LabelFilter labels={labels} />
        <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={practiceMode}
            onChange={e => setPracticeMode(e.target.checked)}
            className="w-4 h-4 accent-indigo-600"
          />
          <span className="text-sm text-gray-600">練習モード（全単語・履歴に記録しない）</span>
        </label>
        <button
          onClick={handleStart}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          学習開始
        </button>
      </div>
    )
  }

  if (isFinished) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">セッション完了！</h2>
        <p className="text-gray-500 mb-6">{progress.total}件の単語を確認しました</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { resetSession(); setStarted(false) }}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            もう一度
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            単語リストへ
          </button>
        </div>
      </div>
    )
  }

  if (!currentWord) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 text-gray-400">
        <p className="text-4xl mb-3">✅</p>
        <p className="text-lg font-medium">今日の復習はありません</p>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          単語リストへ
        </button>
      </div>
    )
  }

  const showTapHint = cardState === 'english' || cardState === 'ipa'
  const showMarkButtons = cardState === 'japanese'

  return (
    <div className="max-w-lg mx-auto">
      <ProgressBar current={progress.current} total={progress.total} />

      <div
        onClick={showTapHint ? tapCard : undefined}
        className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-56 flex flex-col items-center justify-center text-center mb-4 transition-all ${showTapHint ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : ''}`}
      >
        {/* Always show English */}
        <p className="text-3xl font-bold text-gray-900 mb-4">{currentWord.word.english}</p>

        {/* IPA — shown after first tap */}
        {(cardState === 'ipa' || cardState === 'japanese' || cardState === 'marked') && (
          <p className="text-base text-gray-500 font-mono mb-4">{currentWord.word.ipa || '(IPA なし)'}</p>
        )}

        {/* Japanese — shown after second tap */}
        {(cardState === 'japanese' || cardState === 'marked') && (
          <p className="text-xl text-gray-700 font-medium">{currentWord.word.japanese}</p>
        )}

        {/* Tap hint */}
        {showTapHint && (
          <p className="text-xs text-indigo-400 mt-4 animate-pulse">
            {cardState === 'english' ? 'タップして発音を表示' : 'タップして意味を表示'}
          </p>
        )}
      </div>

      {showMarkButtons && (
        <div className="flex gap-3">
          <button
            onClick={() => handleMark(false)}
            className="flex-1 min-h-14 py-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl font-semibold hover:bg-red-100 transition-colors text-lg"
          >
            😓 忘れた
          </button>
          <button
            onClick={() => handleMark(true)}
            className="flex-1 min-h-14 py-3 bg-green-50 border-2 border-green-200 text-green-700 rounded-xl font-semibold hover:bg-green-100 transition-colors text-lg"
          >
            😊 覚えた
          </button>
        </div>
      )}
    </div>
  )
}
