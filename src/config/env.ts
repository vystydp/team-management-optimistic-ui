/**
 * Centralized runtime configuration derived from Vite env vars.
 *
 * Demo mode lets the app be cloned and run with zero setup: no backend process
 * and no GitHub OAuth app. It serves all data from the in-browser MSW mock
 * worker and signs in a stubbed demo user. It is ON by default and turned off
 * only by explicitly opting into a real backend with VITE_USE_REAL_BACKEND=true.
 */
export const DEMO_MODE = import.meta.env.VITE_USE_REAL_BACKEND !== 'true';

/**
 * Base URL for API requests.
 *
 * In demo mode we use a relative URL ('') so requests stay same-origin and are
 * intercepted by the MSW service worker. With a real backend we target it
 * directly (overridable via VITE_API_URL / VITE_BACKEND_URL, default :3001 in
 * dev).
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  (DEMO_MODE ? '' : 'http://localhost:3001');
