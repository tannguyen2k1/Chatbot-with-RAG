"use client";
import { createContext, useState, ReactNode, useEffect } from "react";
import config from "./config";
import React from "react";

// Create the context with an initial value
export const CustomizerContext = createContext(undefined);

// Create the provider component
export const CustomizerContextProvider = ({ children }) => {
  // Helper to get value from localStorage or config
  const getLS = (key, fallback, parseFn) => {
    if (typeof window !== "undefined") {
      const val = localStorage.getItem(key);
      if (val !== null) return parseFn ? parseFn(val) : val;
    }
    return fallback;
  };

  const [activeDir, setActiveDir] = useState(() =>
    getLS("customizer_dir", config.activeDir)
  );
  const [activeMode, setActiveMode] = useState(() =>
    getLS("customizer_mode", config.activeMode)
  );
  const [activeTheme, setActiveTheme] = useState(() =>
    getLS("customizer_theme", config.activeTheme)
  );
  const [activeLayout, setActiveLayout] = useState(() =>
    getLS("customizer_layout", config.activeLayout)
  );
  const [isCardShadow, setIsCardShadow] = useState(() =>
    getLS("customizer_cardShadow", config.isCardShadow, (v) => v === "true")
  );
  const [isLayout, setIsLayout] = useState(() =>
    getLS("customizer_layout", config.isLayout)
  );
  const [isBorderRadius, setIsBorderRadius] = useState(() =>
    getLS("customizer_borderRadius", config.isBorderRadius, Number)
  );
  const [isCollapse, setIsCollapse] = useState(() =>
    getLS("customizer_collapse", config.isCollapse)
  );
  const [isLanguage, setIsLanguage] = useState(() =>
    getLS("customizer_language", config.isLanguage)
  );
  // Save settings to localStorage when change
  const [isSidebarHover, setIsSidebarHover] = useState(false);
  const [isMobileSidebar, setIsMobileSidebar] = useState(false);
  // Set attributes immediately
  useEffect(() => {
    document.documentElement.setAttribute("class", activeMode);
    document.documentElement.setAttribute("dir", activeDir);
    document.documentElement.setAttribute("data-color-theme", activeTheme);
    document.documentElement.setAttribute("data-layout", activeLayout);
    document.documentElement.setAttribute("data-boxed-layout", isLayout);
    document.documentElement.setAttribute("data-sidebar-type", isCollapse);
  }, [activeMode, activeDir, activeTheme, activeLayout, isLayout, isCollapse]);

  return (
    <CustomizerContext.Provider
      value={{
        activeDir,
        setActiveDir,
        activeMode,
        setActiveMode,
        activeTheme,
        setActiveTheme,
        activeLayout,
        setActiveLayout,
        isCardShadow,
        setIsCardShadow,
        isLayout,
        setIsLayout,
        isBorderRadius,
        setIsBorderRadius,
        isCollapse,
        setIsCollapse,
        isLanguage,
        setIsLanguage,
        isSidebarHover,
        setIsSidebarHover,
        isMobileSidebar,
        setIsMobileSidebar,
      }}
    >
      {children}
    </CustomizerContext.Provider>
  );
};
