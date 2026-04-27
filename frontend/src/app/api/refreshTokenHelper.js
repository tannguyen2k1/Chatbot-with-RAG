// Token refresh helper for globalFetcher
import { rawPostFetcher } from './globalFetcher';

// Single-flight refresh: ensure only one refresh runs at a time
let refreshPromise = null;
let hasRedirectedToLogin = false;

export async function refreshTokenIfNeeded(error) {
  // Only handle 401/expired token errors in browser
  if (!error || !error.message) return null;
  if (typeof window === 'undefined') return null;
  if (!/401|token|expired|unauthorized/i.test(error.message)) return null;

  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    try {
      const token = await refreshPromise;
      return token || null;
    } catch (_) {
      return null;
    }
  }

  // Start a new refresh request
  refreshPromise = (async () => {
    try {
      const data = await rawPostFetcher('/api/auth/refresh', {}, {
        credentials: 'include',
      });

      if (data && data.access_token) {
        // Update global access token if available
        if (window.setGlobalAccessToken) {
          window.setGlobalAccessToken(data.access_token);
        }
        return data.access_token;
      }

      return null;
    } catch (err) {
      console.error('Token refresh failed:', err);
      // Redirect to login once
      if (!hasRedirectedToLogin) {
        hasRedirectedToLogin = true;
        window.location.href = '/auth/login';
      }
      return null;
    } finally {
      // Clear the promise so subsequent calls can trigger a new refresh
      refreshPromise = null;
    }
  })();

  try {
    const token = await refreshPromise;
    return token || null;
  } catch (_) {
    return null;
  }
}
