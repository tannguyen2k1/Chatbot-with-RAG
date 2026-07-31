import { getCurrentAccessToken, setGlobalAccessToken } from "./globalFetcher";
import { refreshTokenIfNeeded } from "./refreshTokenHelper";
import { isAccessTokenExpired } from "./jwtUtils";

/**
 * Authenticated fetch with:
 * - Bearer access token
 * - credentials: include (refresh cookie)
 * - proactive refresh near expiry
 * - single 401 retry after refresh (safe with cross-tab lock)
 */
export async function authFetch(url, options = {}) {
  const {
    retryOn401 = true,
    skipAuth = false,
    token: tokenOverride,
    headers: inputHeaders,
    credentials,
    ...rest
  } = options;

  const headers = new Headers(inputHeaders || {});

  let token = skipAuth
    ? null
    : tokenOverride || getCurrentAccessToken();

  if (!skipAuth && typeof window !== "undefined") {
    if (!token || isAccessTokenExpired(token)) {
      const refreshed = await refreshTokenIfNeeded({ message: "401" });
      if (refreshed) {
        token = refreshed;
        setGlobalAccessToken(refreshed);
      }
    }
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const doFetch = (bearer) => {
    const nextHeaders = new Headers(headers);
    if (bearer) {
      nextHeaders.set("Authorization", `Bearer ${bearer}`);
    }
    return fetch(url, {
      ...rest,
      headers: nextHeaders,
      credentials: credentials ?? "include",
    });
  };

  let response = await doFetch(token);

  if (response.status === 401 && retryOn401 && !skipAuth) {
    const refreshed = await refreshTokenIfNeeded({ message: "401" });
    if (refreshed) {
      setGlobalAccessToken(refreshed);
      response = await doFetch(refreshed);
    }
  }

  return response;
}
