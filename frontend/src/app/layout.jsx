import React from "react";

import NextTopLoader from "nextjs-toploader";
import MyApp from "./App";
import "./global.css";
import ClientCustomizerProvider from "./context/ClientCustomizerContext/ClientCustomizerProvider";

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
          <MyApp>{children}</MyApp>
        </ClientCustomizerProvider>
      </body>
    </html>
  );
}
