import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { ScheduleProvider } from './context/ScheduleContext.tsx'
import './index.css'
import { App } from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ScheduleProvider>
        <App />
      </ScheduleProvider>
    </ErrorBoundary>
  </StrictMode>,
)