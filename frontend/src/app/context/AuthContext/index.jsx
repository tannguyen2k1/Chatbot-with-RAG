"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setGlobalAccessToken } from "../../api/globalFetcher";
import { useTenant } from "../TenantContext";
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
  const { tenantCode } = useTenant();

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await refreshAccessToken();
        if (data && data.user) setUser(data.user);
      } catch {
        await logout(false); // Không cần thông báo khi mở trang
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const showSnackbar = (message, severity = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const login = async (username, password) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, tenant_code: tenantCode }),
        credentials: "include",
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Login response is not valid JSON");
      }

      if (!response.ok) throw new Error(data.detail || "Login failed");
      if (!data.access_token) throw new Error("No access_token in response");

      setAccessToken(data.access_token);
      setGlobalAccessToken(data.access_token);
      if (data.user) setUser(data.user);

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
      setAccessToken(null);
      setGlobalAccessToken(null);
      setUser(null);
      router.push("/auth/auth1/login");
      if (showMessage) showSnackbar("Đã đăng xuất", "info");
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Token refresh failed");

      const data = await response.json();
      setAccessToken(data.access_token);
      setGlobalAccessToken(data.access_token);
      if (data.user) setUser(data.user);

      return data;
    } catch (error) {
      console.error("Token refresh error:", error);
      await logout(false);
      throw error;
    }
  };

  // Function để cập nhật tokens từ refresh token helper
  const updateTokensFromRefresh = (accessToken, user) => {
    setAccessToken(accessToken);
    if (user) setUser(user);
  };

  const value = {
    accessToken,
    user,
    isLoading,
    login,
    logout,
    refreshAccessToken,
    getAccessToken: () => accessToken,
    isAuthenticated: () => !!accessToken && !!user,
    updateTokensFromRefresh,
  };

  // Set global getter function khi component mount
  useEffect(() => {
    setGlobalAccessToken(() => accessToken);
  }, [accessToken]);



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
