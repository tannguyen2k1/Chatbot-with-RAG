// Token refresh helper for globalFetcher
import { rawPostFetcher } from './globalFetcher';
export async function refreshTokenIfNeeded(error, originalRequest) {
  if (!error || !error.message) return null;
  if (!window || typeof window === 'undefined') return null;
  // Only handle 401/expired token
  if (!/401|token|expired|unauthorized/i.test(error.message)) return null;
  const refresh_token = localStorage.getItem('refresh_token');
  if (!refresh_token) return null;
  // Call backend refresh endpoint
  let data = null;
  try {
    data = await rawPostFetcher('/api/auth/refresh', { refresh_token });
  } catch {
    // Refresh token cũng hết hạn
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/auth/auth1/login';
    return null;
  }
  if (data && data.access_token) {
    localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    // Gọi lại request cũ với token mới
    if (typeof originalRequest === 'function') {
      return originalRequest();
    }
    return data.access_token;
  }
  return null;
}
