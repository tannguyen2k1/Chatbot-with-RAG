
import React from "react";

import NextTopLoader from 'nextjs-toploader';
import MyApp from './app';
import "./global.css";
import { CustomizerContextProvider } from "./context/customizerContext";


export const metadata = {
  title: 'Modernize Nextjs',
  description: 'Modernize Nextjs',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NextTopLoader color="#5D87FF" />
        <CustomizerContextProvider>
          <MyApp>{children}</MyApp>
        </CustomizerContextProvider>
      </body>
    </html>
  );
}


