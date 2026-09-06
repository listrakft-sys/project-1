// Check if we're in demo mode (no backend available)
// Extracted to a separate module to avoid circular imports with the auth store.
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  // GitHub Pages = demo mode
  if (host.includes('github.io')) return true;
  // No API URL configured = demo mode
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return true;
  // API URL points to localhost but we're on another host = demo mode
  if (apiUrl.includes('localhost') && host !== 'localhost' && host !== '127.0.0.1') return true;
  return false;
}
