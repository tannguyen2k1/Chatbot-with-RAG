import { rawPostFetcher, setGlobalAccessToken } from "./globalFetcher";
import { redirectToLogin, resetLoginRedirect } from "../utils/auth/authRedirect";
import {
  broadcastAuthEvent,
  releaseRefreshLock,
  tryAcquireRefreshLock,
  waitForCrossTabRefresh,
} from "./authSessionSync";

let refreshPromise = null;
let onTokensRefreshed = null;

export function setTokenRefreshHandler(handler) {
  onTokensRefreshed = handler;
}

function applyRefreshedTokens(accessToken, user) {
  if (!accessToken) return null;
  setGlobalAccessToken(accessToken);
  if (typeof onTokensRefreshed === "function") {
    onTokensRefreshed(accessToken, user);
  }
  resetLoginRedirect();
  return { access_token: accessToken, user: user || null };
}

async function performRefreshRequest() {
  const data = await rawPostFetcher(
    "/api/auth/refresh",
    {},
    { credentials: "include" },
  );

  if (!data?.access_token) {
    broadcastAuthEvent({ type: "refresh_failed" });
    return null;
  }

  broadcastAuthEvent({
    type: "refreshed",
    access_token: data.access_token,
    user: data.user || null,
  });

  return applyRefreshedTokens(data.access_token, data.user);
}

/**
 * Single-flight + cross-tab locked refresh.
 * Returns { access_token, user } or null.
 */
export async function refreshSession({ redirectOnFail = true } = {}) {
  if (typeof window === "undefined") return null;

  if (refreshPromise) {
    try {
      return (await refreshPromise) || null;
    } catch {
      return null;
    }
  }

  refreshPromise = (async () => {
    try {
      if (!tryAcquireRefreshLock()) {
        const fromOtherTab = await waitForCrossTabRefresh();
        if (fromOtherTab?.access_token) {
          return applyRefreshedTokens(
            fromOtherTab.access_token,
            fromOtherTab.user,
          );
        }
        if (!tryAcquireRefreshLock()) {
          return null;
        }
      }

      try {
        return await performRefreshRequest();
      } finally {
        releaseRefreshLock();
      }
    } catch (err) {
      console.error("Token refresh failed:", err);
      broadcastAuthEvent({ type: "refresh_failed" });
      releaseRefreshLock();
      if (redirectOnFail) {
        redirectToLogin();
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  try {
    return (await refreshPromise) || null;
  } catch {
    return null;
  }
}

export async function refreshTokenIfNeeded(error) {
  if (!error || !error.message) return null;
  if (typeof window === "undefined") return null;
  if (!/401|token|expired|unauthorized/i.test(error.message)) return null;

  const result = await refreshSession({ redirectOnFail: true });
  return result?.access_token || null;
}
