// Base URL for API requests.
// In development, Vite proxies '/api' to 'http://localhost:3001' (so API_BASE is empty).
// In production on Vercel, defaults to the live Render backend URL 'https://cognispace.onrender.com'
// unless overridden by VITE_API_URL.

export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string) ||
  (typeof (window as unknown as { __API_URL__?: string }).__API_URL__ !== 'undefined'
    ? (window as unknown as { __API_URL__?: string }).__API_URL__ || ''
    : '') ||
  (import.meta.env.PROD ? 'https://cognispace.onrender.com' : '');

/**
 * Builds the full URL for an API endpoint.
 * Accepts paths with or without leading slashes (e.g. '/api/auth/me' or 'api/auth/me').
 */
export function apiUrl(path: string): string {
  if (!API_BASE) {
    return path.startsWith('/') ? path : `/${path}`;
  }
  const cleanBase = API_BASE.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
