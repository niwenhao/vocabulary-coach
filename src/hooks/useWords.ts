import { useState, useEffect, useCallback } from 'react'
import { Word } from '../types'
import { getAllWords, getWordsByLabels, getAllLabels } from '../db/db'

export function useWords(filterLabels: string[] = []) {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data =
        filterLabels.length > 0
          ? await getWordsByLabels(filterLabels)
          : await getAllWords()
      setWords(data)
    } finally {
      setLoading(false)
    }
  }, [filterLabels.join(',')])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { words, loading, refresh }
}

export function useAllLabels() {
  const [labels, setLabels] = useState<string[]>([])

  const refresh = useCallback(async () => {
    const data = await getAllLabels()
    setLabels(data)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { labels, refresh }
}
