"use client";
import React, { useContext, createContext } from "react";
import { AuthContext } from "../AuthContext";

export const UserDataContext = createContext(undefined);

export const UserDataProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  return (
    <UserDataContext.Provider value={{ user }}>
      {children}
    </UserDataContext.Provider>
  );
};
