import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import StudyMode1 from './pages/StudyMode1'
import StudyMode2 from './pages/StudyMode2'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="mode1" element={<StudyMode1 />} />
        <Route path="mode2" element={<StudyMode2 />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
