export interface Word {
  id: number
  english: string
  ipa: string
  japanese: string
  labels: string[]
  createdAt: number
  updatedAt: number
}

export interface ReviewRecord {
  id: number
  wordId: number
  mode: 1 | 2
  interval: number
  repetitions: number
  easeFactor: number
  dueDate: number
  lastReviewedAt: number
}

export interface StudyEvent {
  id: number
  wordId: number
  mode: 1 | 2
  outcome: 'correct' | 'incorrect' | 'remembered' | 'forgot'
  studiedAt: number
}

export interface SessionWord {
  word: Word
  review: ReviewRecord
}
