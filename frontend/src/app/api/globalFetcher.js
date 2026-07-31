import { refreshTokenIfNeeded } from "./refreshTokenHelper";
import { isAccessTokenExpired } from "./jwtUtils";
// SWR fetcher function

// Global access token plumbing
let tokenRef = null;
let getAccessTokenFromContext = null; // optional getter provided by AuthContext

// Function to set the getter function from AuthContext
export const setGlobalAccessToken = (valueOrGetter) => {
  if (typeof valueOrGetter === 'function') {
    // AuthContext provided a getter function
    getAccessTokenFromContext = valueOrGetter;
  } else {
    // Directly set current token value
    tokenRef = valueOrGetter || null;
    // Ensure we always have a getter
    getAccessTokenFromContext = () => tokenRef;
  }
};

// Function to get current access token
export const getCurrentAccessToken = () => {
  if (typeof getAccessTokenFromContext === 'function') {
    try { return getAccessTokenFromContext(); } catch { /* noop */ }
  }
  return tokenRef;
};

const getBaseUrl = () => {
  // On client, use relative path so cookies (refresh_token) are sent same-site
  if (typeof window !== 'undefined') {
    return "";
  }
  // On server (SSR), allow absolute base URL
  return process.env.NEXT_PUBLIC_API_BASE_URL || "";
};

const buildUrl = (url) => {
  if (url.startsWith("/api/")) {
    return getBaseUrl() + url;
  }
  return url;
};

function getAuthHeaders(options = {}) {
  let token = null;
  if (options.token) {
    token = options.token;
  } else {
    token = getCurrentAccessToken();
  }
  return token
    ? { ...options.headers, Authorization: `Bearer ${token}` }
    : { ...options.headers };
}

async function handle401AndRetry(doFetchOnce, setToken) {
  // Ask helper to refresh; it returns a new token or null
  const newToken = await refreshTokenIfNeeded({ message: "401" });
  if (typeof newToken === "string" && newToken.length > 0) {
    // Update local token for the next retry
    if (typeof setToken === 'function') setToken(newToken);
    // Retry once after refresh
    return doFetchOnce();
  }
  // Give up; caller can handle null
  return null;
}

const getFetcher = (url, options = {}) => {
  let token = null;
  if (options.token) token = options.token; else token = getCurrentAccessToken();
  const doFetch = async () => {
    // Preflight refresh if token is missing/expired (client only)
    if (typeof window !== 'undefined' && (!token || isAccessTokenExpired(token))) {
      const preToken = await refreshTokenIfNeeded({ message: "401" });
      if (typeof preToken === 'string' && preToken.length > 0) {
        token = preToken;
      }
    }
    const res = await fetch(buildUrl(url), {
      method: "GET",
      headers: {
        browserrefreshed: "false",
        ...getAuthHeaders({ ...options, token }),
      },
      credentials: 'include',
      ...options,
    });
    if (res.status === 401) {
      const retried = await handle401AndRetry(doFetch, (t) => { token = t; });
      if (retried == null) {
        throw new Error("Unauthorized");
      }
      return retried;
    }
    if (!res.ok) {
      let errorMessage = "Failed to process request";
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        const text = await res.text().catch(() => "");
        errorMessage = text || res.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    return res.json();
  };
  return doFetch();
};

const postFetcher = (url, arg, options = {}) => {
  let token = null;
  if (options.token) token = options.token; else token = getCurrentAccessToken();
  const doFetch = async () => {
    if (typeof window !== 'undefined' && (!token || isAccessTokenExpired(token))) {
      const preToken = await refreshTokenIfNeeded({ message: "401" });
      if (typeof preToken === 'string' && preToken.length > 0) {
        token = preToken;
      }
    }
    const res = await fetch(buildUrl(url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders({ ...options, token }),
      },
      body: JSON.stringify(arg),
      credentials: 'include',
      ...options,
    });
    if (res.status === 401) {
      const retried = await handle401AndRetry(doFetch, (t) => { token = t; });
      if (retried == null) {
        throw new Error("Unauthorized");
      }
      return retried;
    }
    if (!res.ok) {
      let errorMessage = "Failed to process request";
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        const text = await res.text().catch(() => "");
        errorMessage = text || res.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    return res.json();
  };
  return doFetch();
};

// Fetcher không kiểm tra access_token, dùng cho login/refresh
const rawPostFetcher = async (url, arg, options = {}) => {
  const { headers, credentials, ...rest } = options;
  const res = await fetch(buildUrl(url), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(headers || {}) },
    body: JSON.stringify(arg ?? {}),
    credentials: credentials ?? "include",
    ...rest,
  });
  if (!res.ok) {
    let detail = "Failed to post data";
    try {
      const errBody = await res.json();
      detail = errBody.detail || detail;
    } catch {
      /* ignore */
    }
    throw new Error(
      typeof detail === "string" ? detail : `Failed to post data (${res.status})`,
    );
  }
  return res.json();
};

const putFetcher = (url, arg, options = {}) => {
  let token = null;
  if (options.token) token = options.token; else token = getCurrentAccessToken();
  const doFetch = async () => {
    if (typeof window !== 'undefined' && (!token || isAccessTokenExpired(token))) {
      const preToken = await refreshTokenIfNeeded({ message: "401" });
      if (typeof preToken === 'string' && preToken.length > 0) {
        token = preToken;
      }
    }
    const res = await fetch(buildUrl(url), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders({ ...options, token }),
      },
      body: JSON.stringify(arg),
      credentials: 'include',
      ...options,
    });
    if (res.status === 401) {
      const retried = await handle401AndRetry(doFetch, (t) => { token = t; });
      if (retried == null) {
        throw new Error("Unauthorized");
      }
      return retried;
    }
    if (!res.ok) {
      let errorMessage = "Failed to process request";
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        const text = await res.text().catch(() => "");
        errorMessage = text || res.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    return res.json();
  };
  return doFetch();
};

const patchFetcher = (url, arg, options = {}) => {
  let token = null;
  if (options.token) token = options.token; else token = getCurrentAccessToken();
  const doFetch = async () => {
    if (typeof window !== 'undefined' && (!token || isAccessTokenExpired(token))) {
      const preToken = await refreshTokenIfNeeded({ message: "401" });
      if (typeof preToken === 'string' && preToken.length > 0) {
        token = preToken;
      }
    }
    const res = await fetch(buildUrl(url), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders({ ...options, token }),
      },
      body: JSON.stringify(arg),
      credentials: 'include',
      ...options,
    });
    if (res.status === 401) {
      const retried = await handle401AndRetry(doFetch, (t) => { token = t; });
      if (retried == null) {
        throw new Error("Unauthorized");
      }
      return retried;
    }
    if (!res.ok) {
      let errorMessage = "Failed to process request";
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        const text = await res.text().catch(() => "");
        errorMessage = text || res.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    return res.json();
  };
  return doFetch();
};

const deleteFetcher = (url, arg, options = {}) => {
  let token = null;
  if (options.token) token = options.token; else token = getCurrentAccessToken();
  const doFetch = async () => {
    if (typeof window !== 'undefined' && (!token || isAccessTokenExpired(token))) {
      const preToken = await refreshTokenIfNeeded({ message: "401" });
      if (typeof preToken === 'string' && preToken.length > 0) {
        token = preToken;
      }
    }
    const res = await fetch(buildUrl(url), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders({ ...options, token }),
      },
      body: JSON.stringify(arg),
      credentials: 'include',
      ...options,
    });
    if (res.status === 401) {
      const retried = await handle401AndRetry(doFetch, (t) => { token = t; });
      if (retried == null) {
        throw new Error("Unauthorized");
      }
      return retried;
    }
    if (!res.ok) {
      let errorMessage = "Failed to process request";
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        const text = await res.text().catch(() => "");
        errorMessage = text || res.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    // Nếu status là 204 thì không có body, trả về null
    if (res.status === 204) return null;
    return res.json();
  };
  return doFetch();
};

export {
  getFetcher,
  postFetcher,
  putFetcher,
  deleteFetcher,
  patchFetcher,
  rawPostFetcher,
};
