import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import StudyMode1 from './pages/StudyMode1'
import StudyMode2 from './pages/StudyMode2'
import Settings from './pages/Settings'

export default function App() {
  const [unlocked, setUnlocked] = useState(false)

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route
          index
          element={
            unlocked
              ? <Home />
              : <PasswordGateWrapper onUnlock={() => setUnlocked(true)} />
          }
        />
        <Route path="mode1" element={<StudyMode1 />} />
        <Route path="mode2" element={<StudyMode2 />} />
        <Route
          path="settings"
          element={
            unlocked
              ? <Settings />
              : <PasswordGateWrapper onUnlock={() => setUnlocked(true)} />
          }
        />
      </Route>
    </Routes>
  )
}

function PasswordGateWrapper({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (input === '19816516') {
      onUnlock()
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">パスワードを入力</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false) }}
            placeholder="パスワード"
            autoFocus
            className={`px-4 py-2 border rounded-lg text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
              error ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {error && <p className="text-red-500 text-sm text-center">パスワードが正しくありません</p>}
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            解除
          </button>
        </form>
      </div>
    </div>
  )
}
