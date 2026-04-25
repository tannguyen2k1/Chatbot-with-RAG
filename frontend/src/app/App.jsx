"use client";
import React, { useContext } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import RTL from "@/app/(DashboardLayout)/layout/shared/customizer/RTL";
import { ThemeSettings } from "@/utils/theme/Theme";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import "@/utils/i18n";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import { UserDataProvider } from "./context/UserDataContext";
import ThemeSync from "@/app/components/shared/ThemeSync";

const MyApp = ({ children }) => {
  const theme = ThemeSettings();
  const { activeDir } = useContext(CustomizerContext);

  return (
    <>
      <AppRouterCacheProvider options={{ enableCssLayer: true }}>
        <ThemeProvider theme={theme}>
          <ThemeSync />
          <RTL direction={activeDir}>
            <CssBaseline />
            <UserDataProvider>{children}</UserDataProvider>
          </RTL>
        </ThemeProvider>
      </AppRouterCacheProvider>
    </>
  );
};

export default MyApp;
