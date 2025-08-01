"use client";
import dynamic from "next/dynamic";
import Loading from "@/app/loading";

// Dynamic import CustomizerContextProvider, ssr: false
// Dynamic import CustomizerContextProvider, ssr: false
const CustomizerContextProvider = dynamic(
  () =>
    import("./customizerContext").then((mod) => mod.CustomizerContextProvider),
  { ssr: false, loading: () => <Loading /> }
);

export default function ClientCustomizerProvider({ children }) {
  return <CustomizerContextProvider>{children}</CustomizerContextProvider>;
}
