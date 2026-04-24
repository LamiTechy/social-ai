import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

// StrictMode intentionally double-invokes effects in dev which breaks
// Supabase Realtime channel setup — removed to prevent that crash.
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)