// Base URL for API requests. Empty by default: in development Vite proxies /api to :3001, and on Vercel
// vercel.json rewrites /api to the Render backend, so the session cookie stays first-party.
// Set VITE_API_URL only to call a backend on another origin directly.
export const API_BASE: string = ((import.meta.env.VITE_API_URL as string | undefined) || '').replace(/\/+$/, '');

/** Builds the full URL for an API path ('/api/auth/me' or 'api/auth/me'). */
export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
