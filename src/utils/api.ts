// Base URL for API requests.
// In development, Vite proxies '/api' to 'http://localhost:3001' (so API_BASE can be empty).
// In production on Vercel, VITE_API_URL points to the Render backend (e.g. https://cognispace-api.onrender.com).

export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string) ||
  (typeof (window as unknown as { __API_URL__?: string }).__API_URL__ !== 'undefined'
    ? (window as unknown as { __API_URL__?: string }).__API_URL__ || ''
    : '');

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
