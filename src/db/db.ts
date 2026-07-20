import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite'
import { Capacitor } from '@capacitor/core'
import { Word, ReviewRecord, StudyEvent } from '../types'

const sqlite = new SQLiteConnection(CapacitorSQLite)
let db: SQLiteDBConnection | null = null

const DDL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS words (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  english    TEXT NOT NULL UNIQUE,
  ipa        TEXT NOT NULL DEFAULT '',
  japanese   TEXT NOT NULL,
  labels     TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS review_records (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id          INTEGER NOT NULL,
  interval_days    INTEGER NOT NULL DEFAULT 0,
  repetitions      INTEGER NOT NULL DEFAULT 0,
  ease_factor      REAL    NOT NULL DEFAULT 2.5,
  due_date         INTEGER NOT NULL,
  last_reviewed_at INTEGER NOT NULL,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id    INTEGER NOT NULL,
  mode       INTEGER NOT NULL,
  outcome    TEXT    NOT NULL,
  studied_at INTEGER NOT NULL,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_review_due  ON review_records(due_date);
CREATE INDEX IF NOT EXISTS idx_review_word ON review_records(word_id);
CREATE INDEX IF NOT EXISTS idx_study_word  ON study_events(word_id);
`

export async function initDB(): Promise<void> {
  const platform = Capacitor.getPlatform()

  if (platform === 'web') {
    await sqlite.initWebStore()
  }

  const ret = await sqlite.checkConnectionsConsistency()
  const isConn = (await sqlite.isConnection('vocabdb', false)).result
  if (ret.result && isConn) {
    db = await sqlite.retrieveConnection('vocabdb', false)
  } else {
    db = await sqlite.createConnection('vocabdb', false, 'no-encryption', 1, false)
  }

  await db.open()
  await db.execute(DDL)
}

function getDB(): SQLiteDBConnection {
  if (!db) throw new Error('DB not initialized — call initDB() first')
  return db
}

// ── Word queries ──────────────────────────────────────────────────────────────

function rowToWord(row: Record<string, unknown>): Word {
  return {
    id: row['id'] as number,
    english: row['english'] as string,
    ipa: row['ipa'] as string,
    japanese: row['japanese'] as string,
    labels: JSON.parse((row['labels'] as string) || '[]') as string[],
    createdAt: row['created_at'] as number,
    updatedAt: row['updated_at'] as number,
  }
}

export async function getAllWords(): Promise<Word[]> {
  const res = await getDB().query('SELECT * FROM words ORDER BY english ASC')
  return (res.values ?? []).map(rowToWord)
}

export async function getWordsByLabels(labels: string[]): Promise<Word[]> {
  if (labels.length === 0) return getAllWords()
  const placeholders = labels.map(() => '?').join(',')
  const res = await getDB().query(
    `SELECT DISTINCT w.* FROM words w, json_each(w.labels) je
     WHERE je.value IN (${placeholders})
     ORDER BY w.english ASC`,
    labels
  )
  return (res.values ?? []).map(rowToWord)
}

export async function getWordById(id: number): Promise<Word | null> {
  const res = await getDB().query('SELECT * FROM words WHERE id = ?', [id])
  const rows = res.values ?? []
  return rows.length > 0 ? rowToWord(rows[0]) : null
}

export async function insertWord(
  data: Omit<Word, 'id' | 'createdAt' | 'updatedAt'>
): Promise<number> {
  const now = Date.now()
  const res = await getDB().run(
    `INSERT INTO words (english, ipa, japanese, labels, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.english, data.ipa, data.japanese, JSON.stringify(data.labels), now, now]
  )
  return res.changes?.lastId ?? 0
}

export async function updateWord(
  id: number,
  data: Partial<Omit<Word, 'id' | 'createdAt'>>
): Promise<void> {
  const now = Date.now()
  await getDB().run(
    `UPDATE words SET english=?, ipa=?, japanese=?, labels=?, updated_at=? WHERE id=?`,
    [data.english, data.ipa, data.japanese, JSON.stringify(data.labels), now, id]
  )
}

export async function deleteWord(id: number): Promise<void> {
  await getDB().run('DELETE FROM words WHERE id = ?', [id])
}

export async function getAllLabels(): Promise<string[]> {
  const res = await getDB().query(
    `SELECT DISTINCT je.value as label FROM words w, json_each(w.labels) je ORDER BY je.value ASC`
  )
  return (res.values ?? []).map((r) => r['label'] as string)
}

// ── ReviewRecord queries ──────────────────────────────────────────────────────

function rowToReview(row: Record<string, unknown>): ReviewRecord {
  return {
    id: row['id'] as number,
    wordId: row['word_id'] as number,
    interval: row['interval_days'] as number,
    repetitions: row['repetitions'] as number,
    easeFactor: row['ease_factor'] as number,
    dueDate: row['due_date'] as number,
    lastReviewedAt: row['last_reviewed_at'] as number,
  }
}

export async function getReviewByWordId(wordId: number): Promise<ReviewRecord | null> {
  const res = await getDB().query(
    'SELECT * FROM review_records WHERE word_id = ? LIMIT 1',
    [wordId]
  )
  const rows = res.values ?? []
  return rows.length > 0 ? rowToReview(rows[0]) : null
}

export async function insertReview(wordId: number): Promise<void> {
  const now = Date.now()
  await getDB().run(
    `INSERT INTO review_records (word_id, interval_days, repetitions, ease_factor, due_date, last_reviewed_at)
     VALUES (?, 0, 0, 2.5, ?, ?)`,
    [wordId, now, now]
  )
}

export async function updateReview(
  id: number,
  data: Pick<ReviewRecord, 'interval' | 'repetitions' | 'easeFactor' | 'dueDate' | 'lastReviewedAt'>
): Promise<void> {
  await getDB().run(
    `UPDATE review_records
     SET interval_days=?, repetitions=?, ease_factor=?, due_date=?, last_reviewed_at=?
     WHERE id=?`,
    [data.interval, data.repetitions, data.easeFactor, data.dueDate, data.lastReviewedAt, id]
  )
}

export async function getDueWords(labels: string[]): Promise<
  Array<{ word: Word; review: ReviewRecord }>
> {
  const now = Date.now()
  let sql: string
  let params: (string | number)[]

  if (labels.length === 0) {
    sql = `SELECT w.*, r.id as r_id, r.word_id, r.interval_days, r.repetitions, r.ease_factor, r.due_date, r.last_reviewed_at
           FROM words w
           JOIN review_records r ON r.word_id = w.id
           WHERE r.due_date <= ?
           ORDER BY r.due_date ASC`
    params = [now]
  } else {
    const placeholders = labels.map(() => '?').join(',')
    sql = `SELECT DISTINCT w.*, r.id as r_id, r.word_id, r.interval_days, r.repetitions, r.ease_factor, r.due_date, r.last_reviewed_at
           FROM words w
           JOIN review_records r ON r.word_id = w.id
           JOIN json_each(w.labels) je ON je.value IN (${placeholders})
           WHERE r.due_date <= ?
           ORDER BY r.due_date ASC`
    params = [...labels, now]
  }

  const res = await getDB().query(sql, params)
  return (res.values ?? []).map((row) => ({
    word: rowToWord(row),
    review: {
      id: row['r_id'] as number,
      wordId: row['word_id'] as number,
      interval: row['interval_days'] as number,
      repetitions: row['repetitions'] as number,
      easeFactor: row['ease_factor'] as number,
      dueDate: row['due_date'] as number,
      lastReviewedAt: row['last_reviewed_at'] as number,
    },
  }))
}

// ── StudyEvent queries ────────────────────────────────────────────────────────

export async function insertStudyEvent(
  wordId: number,
  mode: 1 | 2,
  outcome: StudyEvent['outcome']
): Promise<void> {
  await getDB().run(
    `INSERT INTO study_events (word_id, mode, outcome, studied_at) VALUES (?, ?, ?, ?)`,
    [wordId, mode, outcome, Date.now()]
  )
}

export async function getStudyHistory(wordId: number): Promise<StudyEvent[]> {
  const res = await getDB().query(
    'SELECT * FROM study_events WHERE word_id = ? ORDER BY studied_at DESC',
    [wordId]
  )
  return (res.values ?? []).map((row) => ({
    id: row['id'] as number,
    wordId: row['word_id'] as number,
    mode: row['mode'] as 1 | 2,
    outcome: row['outcome'] as StudyEvent['outcome'],
    studiedAt: row['studied_at'] as number,
  }))
}

// ── Upsert (for CSV import) ───────────────────────────────────────────────────

export async function upsertWord(
  data: Omit<Word, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ action: 'inserted' | 'updated'; id: number }> {
  const existing = await getDB().query(
    'SELECT id FROM words WHERE english = ? LIMIT 1',
    [data.english]
  )
  const rows = existing.values ?? []

  if (rows.length > 0) {
    const id = rows[0]['id'] as number
    await updateWord(id, data)
    return { action: 'updated', id }
  } else {
    const id = await insertWord(data)
    await insertReview(id)
    return { action: 'inserted', id }
  }
}

export async function clearAllData(): Promise<void> {
  await getDB().execute('DELETE FROM study_events; DELETE FROM review_records; DELETE FROM words;')
}
