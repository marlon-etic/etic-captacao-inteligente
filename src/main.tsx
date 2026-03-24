/* Main entry point for the application - renders the root React component */
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'

// @skip-protected: Do not remove. Required for React rendering.
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
