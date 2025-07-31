import { refreshTokenIfNeeded } from "./refreshTokenHelper";
// SWR fetcher function

const getBaseUrl = () => {
  // if (typeof window !== 'undefined') {
  //     return process.env.NEXT_PUBLIC_API_BASE_URL || '';
  // }
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
  if (typeof window !== "undefined") {
    token = localStorage.getItem("access_token");
  }
  return token
    ? { ...options.headers, Authorization: `Bearer ${token}` }
    : { ...options.headers };
}

const getFetcher = (url, options = {}) => {
  let token = null;
  if (options.token) token = options.token;
  else if (typeof window !== "undefined")
    token = localStorage.getItem("access_token");
  if (!token) return Promise.resolve(null);
  const doFetch = async () => {
    const res = await fetch(buildUrl(url), {
      method: "GET",
      headers: {
        browserrefreshed: "false",
        ...getAuthHeaders({ ...options, token }),
      },
      ...options,
    });
    if (res.status === 401) {
      const refreshed = await refreshTokenIfNeeded({ message: "401" }, doFetch);
      if (refreshed && typeof refreshed !== "string") return refreshed;
      if (typeof refreshed === "string") {
        token = refreshed;
        return doFetch();
      }
      return null;
    }
    if (!res.ok) throw new Error("Failed to fetch the data");
    return res.json();
  };
  return doFetch();
};

const postFetcher = (url, arg, options = {}) => {
  let token = null;
  if (options.token) token = options.token;
  else if (typeof window !== "undefined")
    token = localStorage.getItem("access_token");
  if (!token) return Promise.resolve(null);
  const doFetch = async () => {
    const res = await fetch(buildUrl(url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders({ ...options, token }),
      },
      body: JSON.stringify(arg),
      ...options,
    });
    if (res.status === 401) {
      const refreshed = await refreshTokenIfNeeded({ message: "401" }, doFetch);
      if (refreshed && typeof refreshed !== "string") return refreshed;
      if (typeof refreshed === "string") {
        token = refreshed;
        return doFetch();
      }
      return null;
    }
    if (!res.ok) throw new Error("Failed to post data");
    return res.json();
  };
  return doFetch();
};

// Fetcher không kiểm tra access_token, dùng cho login/refresh
const rawPostFetcher = async (url, arg, options = {}) => {
  const res = await fetch(buildUrl(url), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    body: JSON.stringify(arg),
    ...options,
  });
  if (!res.ok) throw new Error("Failed to post data");
  return res.json();
};

const putFetcher = (url, arg, options = {}) => {
  let token = null;
  if (options.token) token = options.token;
  else if (typeof window !== "undefined")
    token = localStorage.getItem("access_token");
  if (!token) return Promise.resolve(null);
  const doFetch = async () => {
    const res = await fetch(buildUrl(url), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders({ ...options, token }),
      },
      body: JSON.stringify(arg),
      ...options,
    });
    if (res.status === 401) {
      const refreshed = await refreshTokenIfNeeded({ message: "401" }, doFetch);
      if (refreshed && typeof refreshed !== "string") return refreshed;
      if (typeof refreshed === "string") {
        token = refreshed;
        return doFetch();
      }
      return null;
    }
    if (!res.ok) throw new Error("Failed to updated data");
    return res.json();
  };
  return doFetch();
};

const patchFetcher = (url, arg, options = {}) => {
  let token = null;
  if (options.token) token = options.token;
  else if (typeof window !== "undefined")
    token = localStorage.getItem("access_token");
  if (!token) return Promise.resolve(null);
  const doFetch = async () => {
    const res = await fetch(buildUrl(url), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders({ ...options, token }),
      },
      body: JSON.stringify(arg),
      ...options,
    });
    if (res.status === 401) {
      const refreshed = await refreshTokenIfNeeded({ message: "401" }, doFetch);
      if (refreshed && typeof refreshed !== "string") return refreshed;
      if (typeof refreshed === "string") {
        token = refreshed;
        return doFetch();
      }
      return null;
    }
    if (!res.ok) throw new Error("Failed to updated data");
    return res.json();
  };
  return doFetch();
};

const deleteFetcher = (url, arg, options = {}) => {
  let token = null;
  if (options.token) token = options.token;
  else if (typeof window !== "undefined")
    token = localStorage.getItem("access_token");
  if (!token) return Promise.resolve(null);
  const doFetch = async () => {
    const res = await fetch(buildUrl(url), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders({ ...options, token }),
      },
      body: JSON.stringify(arg),
      ...options,
    });
    if (res.status === 401) {
      const refreshed = await refreshTokenIfNeeded({ message: "401" }, doFetch);
      if (refreshed && typeof refreshed !== "string") return refreshed;
      if (typeof refreshed === "string") {
        token = refreshed;
        return doFetch();
      }
      return null;
    }
    if (!res.ok) throw new Error("Failed to delete data");
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
