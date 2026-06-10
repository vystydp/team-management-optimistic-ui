import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { DEMO_MODE } from './config/env';

// Start the MSW mock worker whenever the app runs in demo mode (the default).
// This intentionally also runs in production builds, so the deployed app is a
// self-contained, backend-free showcase. Set VITE_USE_REAL_BACKEND=true to
// disable mocking and talk to a real backend instead.
async function enableMocking() {
  if (!DEMO_MODE) {
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