// Token refresh helper for globalFetcher
import { rawPostFetcher, setGlobalAccessToken } from './globalFetcher';

export async function refreshTokenIfNeeded(error, originalRequest) {
  if (!error || !error.message) return null;
  if (!window || typeof window === 'undefined') return null;
  
  // Only handle 401/expired token
  if (!/401|token|expired|unauthorized/i.test(error.message)) return null;
  
  // Call backend refresh endpoint (refresh token is in httpOnly cookie)
  let data = null;
  try {
    data = await rawPostFetcher('/api/auth/refresh', {}, { 
      credentials: 'include' // Important: include cookies
    });
  } catch (error) {
    console.error('Token refresh failed:', error);
    // If refresh fails, redirect to login
    window.location.href = '/auth/auth1/login';
    return null;
  }
  
  if (data && data.access_token) {
    // Update global access token in memory
    setGlobalAccessToken(data.access_token);
    
    // Call original request again with new token
    if (typeof originalRequest === 'function') {
      return originalRequest();
    }
    return data.access_token;
  }
  
  return null;
}
