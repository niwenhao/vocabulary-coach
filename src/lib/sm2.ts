import { StudyEvent } from '../types'

const MIN_EASE = 1.3
const MS_PER_DAY = 86_400_000

export interface SM2Input {
  quality: 0 | 1 | 2 | 3 | 4 | 5
  repetitions: number
  easeFactor: number
  interval: number
}

export interface SM2Output {
  repetitions: number
  easeFactor: number
  interval: number
  dueDate: number
}

export function sm2(input: SM2Input): SM2Output {
  const { quality, repetitions, easeFactor, interval } = input

  let newEase = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (newEase < MIN_EASE) newEase = MIN_EASE

  let newRepetitions: number
  let newInterval: number

  if (quality < 3) {
    newRepetitions = 0
    newInterval = 1
  } else {
    newRepetitions = repetitions + 1
    if (newRepetitions === 1) {
      newInterval = 1
    } else if (newRepetitions === 2) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval * newEase)
    }
  }

  return {
    repetitions: newRepetitions,
    easeFactor: newEase,
    interval: newInterval,
    dueDate: Date.now() + newInterval * MS_PER_DAY,
  }
}

export function outcomeToQuality(outcome: StudyEvent['outcome']): SM2Input['quality'] {
  switch (outcome) {
    case 'correct':    return 5
    case 'remembered': return 4
    case 'forgot':     return 1
    case 'incorrect':  return 2
  }
}
