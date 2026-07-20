import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { useAllLabels } from '../hooks/useWords'
import { useAppStore } from '../store/useAppStore'
import LabelFilter from '../components/LabelFilter'
import ProgressBar from '../components/ProgressBar'
import { getEffectiveTimeLimit } from '../lib/labelSettings'
import { SessionWord } from '../types'

type Phase = 'waiting' | 'answering' | 'result'
type WordResult = { sessionWord: SessionWord; userInput: string; isCorrect: boolean }

export default function StudyMode1() {
  const navigate = useNavigate()
  const { labels } = useAllLabels()
  const { currentWord, isFinished, progress, buildQueue, recordOutcome } = useSession()
  const { resetSession, activeLabels, setSession, sessionQueue, sessionIndex } = useAppStore()

  const [phase, setPhase] = useState<Phase>('waiting')
  const [input, setInput] = useState('')
  const [isCorrect, setIsCorrect] = useState(false)
  const [practiceMode, setPracticeMode] = useState(false)
  const [timeLimit, setTimeLimit] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const [sessionResults, setSessionResults] = useState<WordResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    resetSession()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === 'answering') inputRef.current?.focus()
  }, [phase, currentWord])

  useEffect(() => {
    if (phase !== 'result') return
    let removed = false
    const id = setTimeout(() => {
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter') handleNext() }
      window.addEventListener('keydown', onKey, { once: true })
      removed = true
      return () => window.removeEventListener('keydown', onKey)
    }, 100)
    return () => { clearTimeout(id); if (!removed) {} }
  }, [phase, currentWord]) // eslint-disable-line react-hooks/exhaustive-deps

  // 全問完了時にタイマーを止めて残り時間を確定
  useEffect(() => {
    if (!isFinished) return
    if (timerRef.current) clearInterval(timerRef.current)
  }, [isFinished])

  // タイムアウト時に未回答の単語をすべて不正解として結果に追加
  useEffect(() => {
    if (!timedOut) return
    const remaining = sessionQueue.slice(sessionIndex)
    setSessionResults((prev) => {
      const seen = new Set(prev.map((r) => r.sessionWord.word.id))
      const extra = remaining
        .filter((sw) => !seen.has(sw.word.id))
        .map((sw) => ({ sessionWord: sw, userInput: '', isCorrect: false }))
      return [...prev, ...extra]
    })
  }, [timedOut]) // eslint-disable-line react-hooks/exhaustive-deps

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return m > 0 ? `${m}分${String(s).padStart(2, '0')}秒` : `${s}秒`
  }

  function startTimer(limit: number) {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeLeft(limit)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          setTimedOut(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function handleStart() {
    const limit = getEffectiveTimeLimit(activeLabels)
    setTimeLimit(limit)
    setTimedOut(false)
    setSessionResults([])
    await buildQueue(1, practiceMode)
    setPhase('answering')
    setInput('')
    if (limit > 0) startTimer(limit)
  }

  function normalise(s: string) {
    return s.toLowerCase().trim()
  }

  function checkAnswer() {
    if (!currentWord) return
    const accepted = currentWord.word.english.split('|').map(normalise)
    const correct = accepted.includes(normalise(input))
    setIsCorrect(correct)
    setPhase('result')
  }

  async function handleNext() {
    if (!currentWord) return
    setSessionResults((prev) => [...prev, { sessionWord: currentWord, userInput: input, isCorrect }])
    await recordOutcome(isCorrect ? 'correct' : 'incorrect', 1, practiceMode)
    setInput('')
    setPhase('answering')
  }

  function handleRetry() {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimedOut(false)
    setTimeLeft(0)
    setSessionResults([])
    resetSession()
    setPhase('waiting')
  }

  function handleRetryIncorrect() {
    const incorrectWords = sessionResults
      .filter((r) => !r.isCorrect)
      .map((r) => r.sessionWord)
    if (timerRef.current) clearInterval(timerRef.current)
    setTimedOut(false)
    setSessionResults([])
    const shuffled = [...incorrectWords].sort(() => Math.random() - 0.5)
    setSession(shuffled)
    setPhase('answering')
    setInput('')
    if (timeLimit > 0) startTimer(timeLimit)
  }

  if (phase === 'waiting') {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">タイピング練習</h1>
        <p className="text-gray-500 mb-6">日本語の意味を見て、英語を入力します。</p>
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

  const showResults = timedOut || isFinished

  if (showResults && sessionResults.length > 0) {
    const correctCount = sessionResults.filter((r) => r.isCorrect).length
    const incorrectCount = sessionResults.length - correctCount
    return (
      <div className="max-w-lg mx-auto py-6">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{timedOut ? '⏰' : '🎉'}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {timedOut ? '時間切れ' : 'セッション完了！'}
          </h2>
          <p className="text-gray-500">
            {correctCount} 正解 / {incorrectCount} 不正解（全 {sessionResults.length} 問）
          </p>
          {timeLimit > 0 && (
            <p className="text-sm text-gray-400 mt-1">
              経過 {formatTime(timeLimit - timeLeft)}　／　残り {formatTime(timeLeft)}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 divide-y mb-4 max-h-96 overflow-y-auto">
          {sessionResults.map((r, i) => (
            <div key={i} className={`px-4 py-3 flex items-start gap-3 ${r.isCorrect ? '' : 'bg-red-50'}`}>
              <span className={`mt-0.5 text-base ${r.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                {r.isCorrect ? '✓' : '✗'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 truncate">{r.sessionWord.word.japanese}</p>
                <p className="text-base font-semibold text-gray-900">{r.sessionWord.word.english}</p>
                {!r.isCorrect && r.userInput && (
                  <p className="text-xs text-red-400">あなたの回答: {r.userInput}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {incorrectCount > 0 && (
            <button
              onClick={handleRetryIncorrect}
              className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
            >
              不正解 {incorrectCount} 件を再復習
            </button>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className="flex-1 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
            >
              もう一度
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
            >
              単語リストへ
            </button>
          </div>
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
        <p className="text-xs text-gray-400 mb-1">{progress.current + 1} / {progress.total}</p>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">日本語</p>
        <p className="text-2xl font-bold text-gray-900 leading-relaxed">
          {currentWord.word.japanese}
        </p>
      </div>

      {phase === 'answering' && (
        <div className="space-y-3">
          {timeLimit > 0 && (
            <div className={`text-center text-sm font-semibold ${timeLeft <= 10 ? 'text-red-500' : 'text-gray-500'}`}>
              経過 {formatTime(timeLimit - timeLeft)}　／　残り {formatTime(timeLeft)}
            </div>
          )}
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
