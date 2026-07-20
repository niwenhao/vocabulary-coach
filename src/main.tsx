import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader'
import App from './App'
import { initDB } from './db/db'
import './index.css'

async function bootstrap() {
  if (Capacitor.getPlatform() === 'web') {
    jeepSqlite(window)
    await customElements.whenDefined('jeep-sqlite')
    const jeepEl = document.createElement('jeep-sqlite')
    document.body.appendChild(jeepEl)
    await customElements.whenDefined('jeep-sqlite')
  }

  await initDB()

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  )
}

bootstrap().catch(console.error)
