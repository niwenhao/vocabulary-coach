import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { useAllLabels } from '../hooks/useWords'
import { useAppStore } from '../store/useAppStore'
import LabelFilter from '../components/LabelFilter'
import ProgressBar from '../components/ProgressBar'

type Phase = 'waiting' | 'answering' | 'result'

export default function StudyMode1() {
  const navigate = useNavigate()
  const { labels } = useAllLabels()
  const { currentWord, isFinished, progress, buildQueue, recordOutcome } = useSession()
  const { resetSession } = useAppStore()

  const [phase, setPhase] = useState<Phase>('waiting')
  const [input, setInput] = useState('')
  const [isCorrect, setIsCorrect] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    resetSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === 'answering') inputRef.current?.focus()
  }, [phase, currentWord])

  async function handleStart() {
    await buildQueue()
    setPhase('answering')
    setInput('')
  }

  function normalise(s: string) {
    return s.toLowerCase().trim()
  }

  function checkAnswer() {
    if (!currentWord) return
    const accepted = currentWord.word.english
      .split('|')
      .map(normalise)
    const correct = accepted.includes(normalise(input))
    setIsCorrect(correct)
    setPhase('result')
  }

  async function handleNext() {
    if (!currentWord) return
    await recordOutcome(isCorrect ? 'correct' : 'incorrect', 1)
    setInput('')
    setPhase('answering')
  }

  if (phase === 'waiting') {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">モード1: 英単語入力</h1>
        <p className="text-gray-500 mb-6">日本語の意味を見て、英語を入力します。</p>
        <LabelFilter labels={labels} />
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
        <p className="text-gray-500 mb-6">{progress.total}件の単語を学習しました</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { resetSession(); setPhase('waiting') }}
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
        <p className="text-sm mt-1">すべての単語が復習済みです</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          単語リストへ
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <ProgressBar current={progress.current} total={progress.total} />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center mb-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">日本語</p>
        <p className="text-2xl font-bold text-gray-900 leading-relaxed">
          {currentWord.word.japanese}
        </p>
      </div>

      {phase === 'answering' && (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && input.trim() && checkAnswer()}
            placeholder="英語を入力..."
            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setInput(''); setIsCorrect(false); setPhase('result') }}
              className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
            >
              スキップ
            </button>
            <button
              onClick={checkAnswer}
              disabled={!input.trim()}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              確認
            </button>
          </div>
        </div>
      )}

      {phase === 'result' && (
        <div className="space-y-3">
          <div className={`rounded-xl p-4 text-center ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-lg font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {isCorrect ? '✓ 正解！' : '✗ 不正解'}
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{currentWord.word.english}</p>
            {currentWord.word.ipa && (
              <p className="text-sm text-gray-500 font-mono mt-1">{currentWord.word.ipa}</p>
            )}
            {!isCorrect && input && (
              <p className="text-sm text-red-500 mt-1">あなたの回答: {input}</p>
            )}
          </div>
          <button
            onClick={handleNext}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            次へ →
          </button>
        </div>
      )}
    </div>
  )
}
