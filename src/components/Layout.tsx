import { NavLink, Outlet } from 'react-router-dom'

export default function Layout() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-700 text-white'
        : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
    }`

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-indigo-800 shadow">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2 flex-wrap">
          <span className="text-white font-bold text-lg mr-4">📚 Vocabular Coach</span>
          <NavLink to="/" end className={linkClass}>単語リスト</NavLink>
          <NavLink to="/mode1" className={linkClass}>モード1</NavLink>
          <NavLink to="/mode2" className={linkClass}>モード2</NavLink>
          <NavLink to="/settings" className={linkClass}>設定</NavLink>
        </div>
      </nav>
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
