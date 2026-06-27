import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'

// Global error handler para errores no capturados
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Aquí podrías enviar a un servicio de logging
});

// Global handler para promesas rechazadas no manejadas
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Aquí podrías enviar a un servicio de logging
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
