"use client";
import { useContext, useEffect } from "react";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import { getFetcher } from "@/app/api/globalFetcher";
import { AuthContext } from "@/app/context/AuthContext";

const ThemeSync = () => {
  const { setActiveMode, setIsLanguage, setIsFontSize } = useContext(CustomizerContext);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const syncTheme = async () => {
      if (!user) return;
      try {
        const data = await getFetcher("/api/configs/general");
        if (data.theme) setActiveMode(data.theme);
        if (data.language) setIsLanguage(data.language);
        if (data.font_size) setIsFontSize(data.font_size);
      } catch (err) {
        console.error("Failed to sync theme from DB:", err);
      }
    };

    syncTheme();
  }, [user, setActiveMode, setIsLanguage]);

  return null;
};

export default ThemeSync;
