import React from "react";

import NextTopLoader from "nextjs-toploader";
import MyApp from "./App";
import "./global.css";
import ClientCustomizerProvider from "./context/ClientCustomizerContext/ClientCustomizerProvider";
import { AuthProvider } from "./context/AuthContext";
import { TenantProvider } from "./context/TenantContext";

export const metadata = {
  title: "AI Assistant",
  description: "Trợ lý AI thông minh",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NextTopLoader color="#5D87FF" />
        <ClientCustomizerProvider>
          <TenantProvider>
            <AuthProvider>
              <MyApp>{children}</MyApp>
            </AuthProvider>
          </TenantProvider>
        </ClientCustomizerProvider>
      </body>
    </html>
  );
}
