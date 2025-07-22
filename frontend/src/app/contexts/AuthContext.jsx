import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BASE_API_URL } from "app/config";
import { isTokenExpired } from "../auth/tokenUtils";

const AuthContext = createContext();

export function AuthProviderCustom({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("access_token") || "");
  const [refreshToken, setRefreshToken] = useState(
    () => localStorage.getItem("refresh_token") || ""
  );
  const [checking, setChecking] = useState(false);
  const [user, setUser] = useState(null); // lưu thông tin user
  const [permissions, setPermissions] = useState({}); // lưu quyền

  // Hàm refresh access token
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) {
      logout();
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(`${BASE_API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      if (!res.ok) throw new Error("Refresh token failed");
      const data = await res.json();
      setToken(data.access_token);
      localStorage.setItem("access_token", data.access_token);
    } catch (e) {
      logout();
    } finally {
      setChecking(false);
    }
  }, [refreshToken]);

  // Lấy thông tin user/me
  const fetchMe = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Không lấy được thông tin user");
      const data = await res.json();
      setUser(data);
      setPermissions(data.permissions || {});
    } catch (e) {
      setUser(null);
      setPermissions({});
    }
  }, [token]);

  // Theo dõi token hết hạn để tự động refresh
  useEffect(() => {
    if (!token) return;
    if (isTokenExpired(token)) {
      refreshAccessToken();
    } else {
      fetchMe();
    }
    // Có thể setInterval để kiểm tra định kỳ nếu muốn
  }, [token, refreshAccessToken, fetchMe]);

  const login = async (username, password) => {
    const res = await fetch(`${BASE_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();
    setToken(data.access_token);
    setRefreshToken(data.refresh_token);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    // Sau khi login, lấy thông tin user/me
    await fetchMe();
    return data;
  };

  const logout = () => {
    setToken("");
    setRefreshToken("");
    setUser(null);
    setPermissions({});
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  };

  // Hàm kiểm tra quyền
  const hasPermission = useCallback(
    (module, action) => {
      if (!permissions || !permissions[module]) return false;
      return permissions[module].includes(action);
    },
    [permissions]
  );

  return (
    <AuthContext.Provider
      value={{
        token,
        refreshToken,
        login,
        logout,
        refreshAccessToken,
        checking,
        user,
        permissions,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthCustom() {
  return useContext(AuthContext);
}
