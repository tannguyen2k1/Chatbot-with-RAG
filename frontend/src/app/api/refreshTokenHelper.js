import { rawPostFetcher, setGlobalAccessToken } from "./globalFetcher";
import { redirectToLogin, resetLoginRedirect } from "../utils/auth/authRedirect";

let refreshPromise = null;
let onTokensRefreshed = null;

export function setTokenRefreshHandler(handler) {
  onTokensRefreshed = handler;
}

export async function refreshTokenIfNeeded(error) {
  if (!error || !error.message) return null;
  if (typeof window === "undefined") return null;
  if (!/401|token|expired|unauthorized/i.test(error.message)) return null;

  if (refreshPromise) {
    try {
      const token = await refreshPromise;
      return token || null;
    } catch {
      return null;
    }
  }

  refreshPromise = (async () => {
    try {
      const data = await rawPostFetcher(
        "/api/auth/refresh",
        {},
        { credentials: "include" },
      );

      if (data?.access_token) {
        setGlobalAccessToken(data.access_token);
        if (typeof onTokensRefreshed === "function") {
          onTokensRefreshed(data.access_token, data.user);
        }
        resetLoginRedirect();
        return data.access_token;
      }

      return null;
    } catch (err) {
      console.error("Token refresh failed:", err);
      redirectToLogin();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  try {
    const token = await refreshPromise;
    return token || null;
  } catch {
    return null;
  }
}
