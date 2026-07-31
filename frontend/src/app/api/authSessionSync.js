const LOCK_KEY = "ca_auth_refresh_lock";
const RESULT_KEY = "ca_auth_refresh_result";
export const AUTH_SYNC_CHANNEL = "ca_auth_sync";
export const LOCK_TTL_MS = 10000;
export const WAIT_TIMEOUT_MS = 12000;

function getTabId() {
  if (typeof window === "undefined") return "ssr";
  if (!window.__ca_auth_tab_id) {
    window.__ca_auth_tab_id = `${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
  return window.__ca_auth_tab_id;
}

function getChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }
  if (!window.__ca_auth_channel) {
    window.__ca_auth_channel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
  }
  return window.__ca_auth_channel;
}

export function broadcastAuthEvent(payload) {
  try {
    getChannel()?.postMessage(payload);
  } catch {
    /* ignore */
  }
  if (typeof window === "undefined") return;
  try {
    if (payload?.type === "refreshed" && payload.access_token) {
      localStorage.setItem(
        RESULT_KEY,
        JSON.stringify({ ...payload, at: Date.now() }),
      );
    }
    if (payload?.type === "logout") {
      localStorage.removeItem(RESULT_KEY);
      localStorage.setItem(
        "ca_auth_logout_at",
        JSON.stringify({ at: Date.now(), tab: getTabId() }),
      );
    }
  } catch {
    /* ignore */
  }
}

export function tryAcquireRefreshLock() {
  if (typeof window === "undefined") return true;
  const now = Date.now();
  const tabId = getTabId();
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    if (raw) {
      const lock = JSON.parse(raw);
      if (lock?.expiresAt > now && lock?.owner && lock.owner !== tabId) {
        return false;
      }
    }
    const next = { owner: tabId, expiresAt: now + LOCK_TTL_MS };
    localStorage.setItem(LOCK_KEY, JSON.stringify(next));
    const verify = JSON.parse(localStorage.getItem(LOCK_KEY) || "{}");
    return verify.owner === tabId;
  } catch {
    return true;
  }
}

export function releaseRefreshLock() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    if (!raw) return;
    const lock = JSON.parse(raw);
    if (lock?.owner === getTabId()) {
      localStorage.removeItem(LOCK_KEY);
    }
  } catch {
    try {
      localStorage.removeItem(LOCK_KEY);
    } catch {
      /* ignore */
    }
  }
}

export function waitForCrossTabRefresh() {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    let settled = false;
    const channel = getChannel();

    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      channel?.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
      resolve(value);
    };

    const accept = (data) => {
      if (data?.type === "refreshed" && data.access_token) {
        finish(data);
      }
      if (data?.type === "refresh_failed") {
        finish(null);
      }
    };

    const onMessage = (event) => accept(event.data);
    const onStorage = (event) => {
      if (event.key === RESULT_KEY && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          if (data?.access_token && Date.now() - (data.at || 0) < WAIT_TIMEOUT_MS) {
            finish(data);
          }
        } catch {
          /* ignore */
        }
      }
      if (event.key === "ca_auth_logout_at" && event.newValue) {
        finish(null);
      }
    };

    const timer = setTimeout(() => finish(null), WAIT_TIMEOUT_MS);
    channel?.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);

    try {
      const existing = JSON.parse(localStorage.getItem(RESULT_KEY) || "null");
      if (
        existing?.access_token &&
        Date.now() - (existing.at || 0) < 2500
      ) {
        finish(existing);
      }
    } catch {
      /* ignore */
    }
  });
}

export function subscribeAuthSync(handler) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const channel = getChannel();
  const onMessage = (event) => {
    if (event?.data) handler(event.data);
  };
  const onStorage = (event) => {
    if (event.key === RESULT_KEY && event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        if (data?.access_token) {
          handler({ type: "refreshed", ...data });
        }
      } catch {
        /* ignore */
      }
    }
    if (event.key === "ca_auth_logout_at" && event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        if (data?.tab !== getTabId()) {
          handler({ type: "logout" });
        }
      } catch {
        handler({ type: "logout" });
      }
    }
  };

  channel?.addEventListener("message", onMessage);
  window.addEventListener("storage", onStorage);
  return () => {
    channel?.removeEventListener("message", onMessage);
    window.removeEventListener("storage", onStorage);
  };
}
