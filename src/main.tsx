import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Start MSW in development (only if not using real backend)
async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Don't start MSW if using real backend
  const useRealBackend = import.meta.env.VITE_USE_REAL_BACKEND === 'true';
  if (useRealBackend) {
    if (import.meta.env.DEV) {
      console.log('[MSW] Disabled - using real backend at', import.meta.env.VITE_BACKEND_URL);
    }
    return;
  }

  const { worker } = await import('./mocks/browser');
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});