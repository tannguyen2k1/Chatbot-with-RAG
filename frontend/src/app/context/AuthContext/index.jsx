"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { setGlobalAccessToken, rawPostFetcher } from "../../api/globalFetcher";
import { setTokenRefreshHandler } from "../../api/refreshTokenHelper";
import { useTenant } from "../TenantContext";
import { isAuthPath, redirectToLogin, resetLoginRedirect } from "../../utils/auth/authRedirect";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { tenantCode } = useTenant();

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  // Check session on protected routes
  useEffect(() => {
    let cancelled = false;

    if (isAuthPath(pathname)) {
      setIsLoading(false);
      resetLoginRedirect();
      if (accessToken && user) {
        router.replace("/");
      }
      return undefined;
    }

    const checkAuth = async () => {
      // Already logged in (e.g. right after login) — don't force refresh again
      if (accessToken && user) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const data = await refreshAccessToken();
        if (!cancelled && data?.user) setUser(data.user);
      } catch {
        if (!cancelled) {
          clearAuthState();
          redirectToLogin(router, pathname);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    checkAuth();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const clearAuthState = () => {
    setAccessToken(null);
    setGlobalAccessToken(null);
    setUser(null);
  };

  const showSnackbar = (message, severity = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const login = async (username, password, rememberMe = true, tenantOverride = null) => {
    const effectiveTenant = tenantOverride || tenantCode;
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          tenant_code: effectiveTenant,
          remember_me: rememberMe,
        }),
        credentials: "include",
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Login response is not valid JSON");
      }

      if (!response.ok) throw new Error(data.detail || data.error || "Login failed");
      if (!data.access_token) throw new Error("No access_token in response");

      setAccessToken(data.access_token);
      setGlobalAccessToken(data.access_token);
      if (data.user) setUser(data.user);
      resetLoginRedirect();

      showSnackbar("Đăng nhập thành công!", "success");
      return data;
    } catch (error) {
      console.error("Login error:", error);
      showSnackbar(error.message || "Đăng nhập thất bại", "error");
      throw error;
    }
  };

  const logout = async (showMessage = true) => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthState();
      resetLoginRedirect();
      redirectToLogin(router, pathname);
      if (showMessage) showSnackbar("Đã đăng xuất", "info");
    }
  };

  const refreshAccessToken = async () => {
    try {
      const data = await rawPostFetcher(
        "/api/auth/refresh",
        {},
        { credentials: "include" }
      );
      
      setAccessToken(data.access_token);
      setGlobalAccessToken(data.access_token);
      if (data.user) setUser(data.user);
      resetLoginRedirect();

      return data;
    } catch (error) {
      console.error("Token refresh error:", error);
      throw error;
    }
  };

  // Function để cập nhật tokens từ refresh token helper
  const updateTokensFromRefresh = (token, userData) => {
    setAccessToken(token);
    setGlobalAccessToken(token);
    if (userData) setUser(userData);
    resetLoginRedirect();
  };

  const changePassword = async (passwordData) => {
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(passwordData),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Change password failed");
      }

      const data = await response.json();
      showSnackbar(
        "Đổi mật khẩu thành công! Vui lòng đăng nhập lại.",
        "success",
      );

      // Logout và redirect về màn hình đăng nhập vì token đã bị invalidate
      setTimeout(() => {
        logout(false); // false = không show message vì đã show ở trên
      }, 1500); // Delay 1.5s để user thấy thông báo thành công

      return data;
    } catch (error) {
      console.error("Change password error:", error);
      showSnackbar(error.message || "Đổi mật khẩu thất bại", "error");
      throw error;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(profileData),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Update profile failed");
      }

      const data = await response.json();
      // Update user data in context
      setUser(data);
      showSnackbar("Cập nhật thông tin thành công!", "success");
      return data;
    } catch (error) {
      console.error("Update profile error:", error);
      showSnackbar(error.message || "Cập nhật thông tin thất bại", "error");
      throw error;
    }
  };

  const value = {
    accessToken,
    user,
    isLoading,
    login,
    logout,
    refreshAccessToken,
    changePassword,
    updateProfile,
    getAccessToken: () => accessToken,
    isAuthenticated: () => !!accessToken && !!user,
    updateTokensFromRefresh,
  };

  // Keep globalFetcher in sync when refresh happens outside AuthContext
  useEffect(() => {
    setTokenRefreshHandler(updateTokensFromRefresh);
    return () => setTokenRefreshHandler(null);
  }, []);

  // Set global getter function khi component mount
  useEffect(() => {
    setGlobalAccessToken(() => accessToken);
  }, [accessToken]);

  // Gate rendering until auth check completes (except on auth pages)
  if (isLoading && !isAuthPath(pathname)) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Snackbar UI */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </AuthContext.Provider>
  );
};
