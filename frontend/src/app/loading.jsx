"use client";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

import { useEffect, useState } from "react";

export default function Loading() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDark(localStorage.getItem("customizer_mode") === "dark");
    }
  }, []);
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100vh",
        bgcolor: isDark ? "#2A3447" : "#fff",
        transition: "background 0.2s",
      }}
    >
      <CircularProgress color={isDark ? "inherit" : "primary"} />
    </Box>
  );
}
