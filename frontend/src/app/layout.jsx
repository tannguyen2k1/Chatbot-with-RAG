import React from "react";

import NextTopLoader from "nextjs-toploader";
import MyApp from "./App";
import "./global.css";
import ClientCustomizerProvider from "./context/ClientCustomizerContext/ClientCustomizerProvider";
import { AuthProvider } from "./context/AuthContext";
import { SnackbarProvider } from "./context/SnackbarContext";

export const metadata = {
  title: "UTC Student Chatbot",
  description: "Chatbot hỗ trợ sinh viên Trường Đại học Giao thông Vận tải",
  icons: {
    icon: "/images/logos/utc-emblem.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NextTopLoader color="#0B4DA2" />
        <ClientCustomizerProvider>
          <SnackbarProvider>
            <AuthProvider>
              <MyApp>{children}</MyApp>
            </AuthProvider>
          </SnackbarProvider>
        </ClientCustomizerProvider>
      </body>
    </html>
  );
}
