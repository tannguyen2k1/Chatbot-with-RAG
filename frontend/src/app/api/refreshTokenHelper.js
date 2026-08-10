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

const TRANSIENT_RETRY_ATTEMPTS = 3;
const TRANSIENT_RETRY_BASE_MS = 700;

export function setTokenRefreshHandler(handler) {
  onTokensRefreshed = handler;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isTransientRefreshError(err) {
  const status = err?.status;
  return status === 0 || status === 502 || status === 503 || status === 504 || status === 500;
}

export function isAuthRefreshError(err) {
  const status = err?.status;
  return status === 401 || status === 403;
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

async function performRefreshRequestWithRetry() {
  let lastErr = null;
  for (let attempt = 0; attempt < TRANSIENT_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await performRefreshRequest();
    } catch (err) {
      lastErr = err;
      if (isAuthRefreshError(err)) throw err;
      if (!isTransientRefreshError(err) || attempt === TRANSIENT_RETRY_ATTEMPTS - 1) {
        throw err;
      }
      await sleep(TRANSIENT_RETRY_BASE_MS * (attempt + 1));
    }
  }
  throw lastErr;
}

/**
 * Single-flight + cross-tab locked refresh.
 * Returns { access_token, user } or null.
 * Throws on transient backend/proxy failures after retries (status 0/5xx).
 */
export async function refreshSession({ redirectOnFail = true } = {}) {
  if (typeof window === "undefined") return null;

  if (refreshPromise) {
    try {
      return (await refreshPromise) || null;
    } catch (err) {
      if (isTransientRefreshError(err)) throw err;
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
        return await performRefreshRequestWithRetry();
      } finally {
        releaseRefreshLock();
      }
    } catch (err) {
      console.error("Token refresh failed:", err);
      releaseRefreshLock();
      if (isAuthRefreshError(err)) {
        broadcastAuthEvent({ type: "refresh_failed" });
        if (redirectOnFail) {
          redirectToLogin();
        }
        return null;
      }
      // Transient (backend restart / Next proxy ECONNRESET → 500): surface to caller
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function refreshTokenIfNeeded(error) {
  if (!error || !error.message) return null;
  if (typeof window === "undefined") return null;
  if (!/401|token|expired|unauthorized/i.test(error.message)) return null;

  try {
    const result = await refreshSession({ redirectOnFail: true });
    return result?.access_token || null;
  } catch {
    return null;
  }
}
