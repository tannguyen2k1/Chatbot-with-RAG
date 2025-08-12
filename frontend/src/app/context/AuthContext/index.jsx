"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setGlobalAccessToken } from "../../api/globalFetcher";

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

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("access_token");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        if (storedToken) {
          setAccessToken(storedToken);
          setGlobalAccessToken(storedToken);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include", // Always include cookies for refresh token
      });
      // Log raw response for debugging
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Login response is not valid JSON:", text);
        throw new Error("Login response is not valid JSON");
      }
      console.log("Login response data:", data);
      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }
      if (!data.access_token) {
        throw new Error("No access_token in response");
      }
      setAccessToken(data.access_token);
      setGlobalAccessToken(data.access_token);
      localStorage.setItem("access_token", data.access_token);
      if (data.user) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
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
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      router.push("/auth/auth1/login");
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Token refresh failed");
      }
      const data = await response.json();
      setAccessToken(data.access_token);
      setGlobalAccessToken(data.access_token);
      localStorage.setItem("access_token", data.access_token);
      return data.access_token;
    } catch (error) {
      console.error("Token refresh error:", error);
      await logout();
      throw error;
    }
  };

  const getAccessToken = () => {
    return accessToken;
  };

  const isAuthenticated = () => {
    return !!accessToken && !!user;
  };

  const value = {
    accessToken,
    user,
    isLoading,
    login,
    logout,
    refreshAccessToken,
    getAccessToken,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
