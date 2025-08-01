"use client";
import { createContext, useState, useEffect, useLayoutEffect } from "react";
import config from "@/utils/config";
import React from "react";

// Create the context with an initial value
export const CustomizerContext = createContext(undefined);

// Create the provider component
export const CustomizerContextProvider = ({ children }) => {
  // Khởi tạo state bằng config mặc định
  const [activeDir, setActiveDir] = useState(config.activeDir);
  const [activeMode, setActiveMode] = useState(config.activeMode);
  const [activeTheme, setActiveTheme] = useState(config.activeTheme);
  const [activeLayout, setActiveLayout] = useState(config.activeLayout);
  const [isCardShadow, setIsCardShadow] = useState(config.isCardShadow);
  const [isLayout, setIsLayout] = useState(config.isLayout);
  const [isBorderRadius, setIsBorderRadius] = useState(config.isBorderRadius);
  const [isCollapse, setIsCollapse] = useState(config.isCollapse);
  const [isLanguage, setIsLanguage] = useState(config.isLanguage);

  // trước mount, cập nhật lại state từ localStorage nếu có
  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      const dir = localStorage.getItem("customizer_dir");
      if (dir) setActiveDir(dir);
      const mode = localStorage.getItem("customizer_mode");
      if (mode) setActiveMode(mode);
      const theme = localStorage.getItem("customizer_theme");
      if (theme) setActiveTheme(theme);
      const layout = localStorage.getItem("customizer_layout");
      if (layout) setActiveLayout(layout);
      const cardShadow = localStorage.getItem("customizer_cardShadow");
      if (cardShadow !== null) setIsCardShadow(cardShadow === "true");
      const layoutBoxed = localStorage.getItem("customizer_layout");
      if (layoutBoxed) setIsLayout(layoutBoxed);
      const borderRadius = localStorage.getItem("customizer_borderRadius");
      if (borderRadius !== null) setIsBorderRadius(Number(borderRadius));
      const collapse = localStorage.getItem("customizer_collapse");
      if (collapse) setIsCollapse(collapse);
      const language = localStorage.getItem("customizer_language");
      if (language) setIsLanguage(language);
    }
  }, []);
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
