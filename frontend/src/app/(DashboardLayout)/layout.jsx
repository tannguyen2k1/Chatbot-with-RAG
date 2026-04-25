"use client";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { styled, useTheme } from "@mui/material/styles";
import React, { useContext } from "react";
import Header from "./layout/vertical/header/Header";
import Sidebar from "./layout/vertical/sidebar/Sidebar";
import Customizer from "./layout/shared/customizer/Customizer";
import Navigation from "./layout/horizontal/navbar/Navigation";
import HorizontalHeader from "./layout/horizontal/header/Header";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import config from "@/utils/config";
import { usePathname } from "next/navigation";
import ChatSupport from "@/app/components/shared/ChatSupport";

const MainWrapper = styled("div")(() => ({
  display: "flex",
  minHeight: "100vh",
  width: "100%",
}));

const PageWrapper = styled("div")(() => ({
  display: "flex",
  flexGrow: 1,
  flexDirection: "column",
  zIndex: 1,
  width: "100%",
  backgroundColor: "transparent",
}));

export default function RootLayout({ children }) {
  const { activeLayout, isLayout, activeMode, isCollapse } =
    useContext(CustomizerContext);
  const theme = useTheme();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const MiniSidebarWidth = config.miniSidebarWidth;

  return (
    <MainWrapper
      className={activeMode === "dark" ? "darkbg mainwrapper" : "mainwrapper"}
    >
      {/* Sidebar */}
      {activeLayout === "horizontal" ? "" : <Sidebar />}

      {/* Main Wrapper */}
      <PageWrapper
        className="page-wrapper"
        sx={{
          ...(isCollapse === "mini-sidebar" && {
            [theme.breakpoints.up("lg")]: {
              ml: `${MiniSidebarWidth}px`,
            },
          }),
          ...(isHome && {
            height: "100vh",
          }),
        }}
      >
        {/* Header */}
        {activeLayout === "horizontal" ? <HorizontalHeader /> : <Header />}
        {activeLayout === "horizontal" ? <Navigation /> : ""}

        {isHome ? (
          <Box sx={{ width: "100%", height: "100vh" }}>{children}</Box>
        ) : (
          <Container
            sx={{
              pt: "30px",
              maxWidth: isLayout === "boxed" ? "lg" : "100%!important",
            }}
          >
            <Box sx={{ minHeight: "calc(100vh - 170px)" }}>{children}</Box>
          </Container>
        )}
        {!isHome && <Customizer />}
        <ChatSupport />
      </PageWrapper>
    </MainWrapper>
  );
}
