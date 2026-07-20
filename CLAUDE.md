# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start Vite dev server at http://localhost:5173
npm run build        # tsc type-check + Vite production build → dist/
npm run preview      # serve production build locally

npm run android:sync # npm run build && npx cap sync  (copy dist/ into Android project)
npm run android:open # open in Android Studio
npm run android:run  # run on connected device/emulator
```

No test runner is configured.

## Architecture

### Startup sequence

`main.tsx` bootstraps asynchronously before React mounts:
1. On web: registers the `jeep-sqlite` custom element and appends it to `<body>`
2. Calls `initDB()` which creates/opens the SQLite connection and runs DDL
3. Only then renders the React tree

This means **the DB is always ready** by the time any component renders. Never call DB functions before `initDB()` resolves.

### Data layer (`src/db/db.ts`)

Single module that owns all SQL. `@capacitor-community/sqlite` is used directly — no ORM. On web it uses SQLite WASM via `jeep-sqlite`; on Android it uses the native SQLite engine. The API is identical in both environments.

Three tables: `words`, `review_records` (one per word, holds SM-2 state), `study_events` (append-only history).

`labels` is stored as a JSON string (`'["TOEIC","business"]'`) and queried with SQLite's `json_each()`. When reading rows, `JSON.parse()` converts it back to `string[]`.

`upsertWord()` uses `english` as the natural key — import is idempotent.

### State management

**Persistent state** → SQLite only (never duplicated in Zustand).  
**UI/ephemeral state** → Zustand (`src/store/useAppStore.ts`):
- `activeLabels: string[]` — currently selected label filter (empty = all words)
- `sessionQueue / sessionIndex` — the in-progress study session queue

### Study session flow (`src/hooks/useSession.ts`)

`buildQueue()` calls `getDueWords(activeLabels)` (SQL: `due_date <= now`), shuffles results, and stores them in Zustand. `recordOutcome()` runs the SM-2 algorithm, writes updated `review_records`, appends a `study_events` row, then advances `sessionIndex`.

Study pages call `resetSession()` on mount so stale queues don't carry over between sessions.

### Typing mode timer (`src/pages/StudyMode1.tsx`)

Per-session countdown driven by `setInterval` in `startTimer()`. State: `timeLimit` (total seconds, 0 = no limit), `timeLeft` (countdown). Elapsed time is derived as `timeLimit - timeLeft` — not stored separately.

`formatTime(secs)` renders as `X分XX秒` (≥60 s) or `XX秒` (<60 s). Both elapsed and remaining are shown during answering and on the results screen. Timer stops on `isFinished` (all words answered) via a `useEffect`; on timeout `timedOut` flips to true and remaining words are recorded as incorrect.

### SM-2 algorithm (`src/lib/sm2.ts`)

Pure function — no side effects. Quality mapping: `correct → 5`, `remembered → 4`, `incorrect → 2`, `forgot → 1`. A new word's `ReviewRecord` is initialised with `dueDate = Date.now()` so it appears immediately in `getDueWords`.

### Import / Export formats

Import/export logic lives in `src/lib/csv.ts` (despite the name, it handles both CSV and Excel).

**CSV** (`importFromCSV` / `exportToCSV`) — uses `papaparse`:

| column | separator |
|--------|-----------|
| `english` | — |
| `ipa` | — |
| `japanese` | quoted if it contains commas |
| `labels` | `;` within the field (not `,`) |

**Excel** (`importFromExcel` / `exportToExcel`) — uses `xlsx` (SheetJS). First sheet is read/written. Column headers are identical to CSV: `english`, `ipa`, `japanese`, `labels` (labels still `;`-separated within the cell).

Both import functions call `upsertWord()` and are idempotent.

Alternative spellings for Mode 1 answer-checking are stored as `"color\|colour"` in the `english` field and split on `|` at comparison time.

### Vite config note

`base: './'` in `vite.config.ts` is required for Capacitor. Removing it breaks asset loading in the Android WebView (`capacitor://` origin).

### Android build prerequisites

Android SDK must be installed and `ANDROID_HOME` set. Java 21+ required. After installing the SDK:

```bash
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
sdkmanager --licenses
```
