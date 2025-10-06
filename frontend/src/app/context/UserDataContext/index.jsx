"use client";
import React, { useContext, createContext } from "react";
import { AuthContext } from "../AuthContext";

export const UserDataContext = createContext(undefined);

export const UserDataProvider = ({ children }) => {
  const { user, refreshAccessToken } = useContext(AuthContext);
  
  const refreshUserData = async () => {
    try {
      const data = await refreshAccessToken();
      return data.user;
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      throw error;
    }
  };

  return (
    <UserDataContext.Provider value={{ user, refreshUserData }}>
      {children}
    </UserDataContext.Provider>
  );
};
