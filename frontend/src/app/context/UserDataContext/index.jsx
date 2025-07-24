"use client";
import React, { createContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFetcher, rawPostFetcher } from "@/app/api/globalFetcher";

export const UserDataContext = createContext(undefined);

export const UserDataProvider = ({ children }) => {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Load token & user from localStorage on mount
  useEffect(() => {
    const storedToken =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
    const storedUser =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (storedToken) {
      setToken(storedToken);
    }
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    // Nếu không có token thì clear toàn bộ localStorage và chuyển hướng về login (SPA)
    if (!storedToken) {
      localStorage.clear();
      router.push("/auth/auth1/login");
    }
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      const res = await rawPostFetcher("/api/auth/login", {
        username,
        password,
      });
      if (res && res.access_token) {
        setToken(res.access_token);
        localStorage.setItem("access_token", res.access_token);
        localStorage.setItem("refresh_token", res.refresh_token);
        // Fetch user info
        const userRes = await getFetcher("/api/auth/me", {
          headers: { Authorization: `Bearer ${res.access_token}` },
        });
        setUser(userRes);
        localStorage.setItem("user", JSON.stringify(userRes));
        return { success: true };
      } else {
        throw new Error("Login failed");
      }
    } catch (err) {
      setError(err.message || "Login error");
      setToken(null);
      setUser(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      return { success: false, message: err.message };
    }
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.clear();
    router.push("/auth/auth1/login");
  };

  return (
    <UserDataContext.Provider
      value={{
        user,
        token,
        login,
        logout,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
};
