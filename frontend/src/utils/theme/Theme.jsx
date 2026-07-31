import _ from "lodash";
import { createTheme, useMediaQuery } from "@mui/material";
import { viVN, enUS } from "@mui/material/locale";

import { useEffect, useContext } from "react";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";

import components from "./Components";
import typography from "./Typography";
import { shadows, darkshadows } from "./Shadows";
import { DarkThemeColors } from "./DarkThemeColors";
import { LightThemeColors } from "./LightThemeColors";
import { baseDarkTheme, baselightTheme } from "./DefaultColors";

export const BuildTheme = (config) => {
  const themeOptions = LightThemeColors.find(
    (theme) => theme.name === config.theme
  );
  const darkthemeOptions = DarkThemeColors.find(
    (theme) => theme.name === config.theme
  );
  const { isBorderRadius, isLanguage } = useContext(CustomizerContext);
  const activeMode = config.mode || "light";

  const defaultTheme = activeMode === "dark" ? baseDarkTheme : baselightTheme;
  const defaultShadow = activeMode === "dark" ? darkshadows : shadows;
  const themeSelect = activeMode === "dark" ? darkthemeOptions : themeOptions;
  const locale = (isLanguage || config.language) === "en" ? enUS : viVN;
  const baseMode = {
    palette: {
      mode: activeMode,
    },
    shape: {
      borderRadius: isBorderRadius ?? 7,
    },
    shadows: defaultShadow,
    typography: {
      ...typography,
      fontSize: config.fontSize === 'small' ? 12 : config.fontSize === 'large' ? 16 : 14,
    },
  };
  const theme = createTheme(
    _.merge({}, baseMode, defaultTheme, themeSelect || {}, {
      direction: config.direction,
    }),
    locale,
  );
  theme.components = components(theme);

  return theme;
};

const ThemeSettings = () => {
  const { activeDir, activeTheme, isFontSize, activeMode } = useContext(CustomizerContext);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  const resolvedMode = activeMode === 'system' 
    ? (prefersDarkMode ? 'dark' : 'light') 
    : activeMode;

  const theme = BuildTheme({
    direction: activeDir,
    theme: activeTheme,
    fontSize: isFontSize,
    mode: resolvedMode,
  });
  useEffect(() => {
    document.dir = activeDir;
  }, [activeDir]);

  return theme;
};

export { ThemeSettings };
