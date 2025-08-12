import React from "react";

import NextTopLoader from "nextjs-toploader";
import MyApp from "./App";
import "./global.css";
import ClientCustomizerProvider from "./context/ClientCustomizerContext/ClientCustomizerProvider";
import { AuthProvider } from "./context/AuthContext";

export const metadata = {
  title: "Modernize Nextjs",
  description: "Modernize Nextjs",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NextTopLoader color="#5D87FF" />
        <ClientCustomizerProvider>
          <AuthProvider>
            <MyApp>{children}</MyApp>
          </AuthProvider>
        </ClientCustomizerProvider>
      </body>
    </html>
  );
}
