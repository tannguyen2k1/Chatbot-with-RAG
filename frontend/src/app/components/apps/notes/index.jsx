"use client";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import NoteSidebar from "@/app/components/apps/notes/NoteSidebar";
import NoteContent from "@/app/components/apps/notes/NoteContent";
import { usePathname } from "next/navigation";
import { mutate } from "swr";

const NotesApp = () => {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(true);

  const lgDown = useMediaQuery((theme) => theme.breakpoints.down("lg"));


  const location = usePathname();

  // Reset Notes on browser refresh
  const handleResetTickets = async () => {
    const response = await fetch("/api/notes", {
      method: 'GET',
      headers: {
        "broserRefreshed": "true"
      }
    });
    const result = await response.json();
    await mutate("/api/notes");
  }

  useEffect(() => {
    const isPageRefreshed = sessionStorage.getItem("isPageRefreshed");
    if (isPageRefreshed === "true") {
      console.log("page refreshed");
      sessionStorage.removeItem("isPageRefreshed");
      handleResetTickets();
    }
  }, [location]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem("isPageRefreshed", "true");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
  return (
    <>
      {lgDown ? (
        <NoteSidebar
          isMobileSidebarOpen={isMobileSidebarOpen}
          onSidebarClose={() => setMobileSidebarOpen(false)}
        />
      ) : (
        <NoteSidebar
          isMobileSidebarOpen={true}
          onSidebarClose={() => setMobileSidebarOpen(false)}
        />
      )}

      <Box flexGrow={1}>
        <NoteContent
          toggleNoteSidebar={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
        />
      </Box>
    </>
  );
};

export default NotesApp;
