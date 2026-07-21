import { useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import { getDueWords, getAllWordsWithReviews, updateReview, insertStudyEvent } from '../db/db'
import { sm2, outcomeToQuality } from '../lib/sm2'
import { StudyEvent, SessionWord } from '../types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function useSession() {
  const { activeLabels, sessionQueue, sessionIndex, setSession, advanceSession, requeueWord } = useAppStore()

  const currentWord: SessionWord | null = sessionQueue[sessionIndex] ?? null
  const isFinished = sessionIndex >= sessionQueue.length && sessionQueue.length > 0

  const buildQueue = useCallback(async (mode: 1 | 2, practice = false) => {
    const words = practice
      ? await getAllWordsWithReviews(activeLabels, mode)
      : await getDueWords(activeLabels, mode)
    setSession(shuffle(words))
  }, [activeLabels, setSession])

  const recordOutcome = useCallback(
    async (outcome: StudyEvent['outcome'], mode: 1 | 2, practice = false) => {
      if (!currentWord) return

      const quality = outcomeToQuality(outcome)

      if (practice) {
        if (quality < 3) {
          requeueWord({ word: currentWord.word, review: currentWord.review })
        } else {
          advanceSession()
        }
        return
      }

      const result = sm2({
        quality,
        repetitions: currentWord.review.repetitions,
        easeFactor: currentWord.review.easeFactor,
        interval: currentWord.review.interval,
      })

      const now = Date.now()
      await updateReview(currentWord.review.id, {
        interval: result.interval,
        repetitions: result.repetitions,
        easeFactor: result.easeFactor,
        dueDate: result.dueDate,
        lastReviewedAt: now,
      })

      await insertStudyEvent(currentWord.word.id, mode, outcome)

      advanceSession()
    },
    [currentWord, advanceSession, requeueWord]
  )

  return {
    currentWord,
    isFinished,
    progress: { current: sessionIndex, total: sessionQueue.length },
    buildQueue,
    recordOutcome,
  }
}
