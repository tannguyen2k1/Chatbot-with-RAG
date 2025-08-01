import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { styled } from "@mui/material/styles";
import config from "@/utils/config";
import { useContext, useEffect } from "react";
// ...existing code...
import { IconMenu2, IconMoon, IconSun } from "@tabler/icons-react";
import Profile from "./Profile";
import Search from "./Search";
import Language from "./Language";
import { CustomizerContext } from "@/app/context/customizerContext";

const Header = () => {
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));

  const TopbarHeight = config.topbarHeight;

  // drawer
  const {
    activeMode,
    setActiveMode,
    setIsCollapse,
    isCollapse,
    isMobileSidebar,
    setIsMobileSidebar,
  } = useContext(CustomizerContext);

  const AppBarStyled = styled(AppBar)(({ theme }) => ({
    boxShadow: "none",
    background: theme.palette.background.paper,
    justifyContent: "center",
    backdropFilter: "blur(4px)",
    [theme.breakpoints.up("lg")]: {
      minHeight: TopbarHeight,
    },
  }));
  const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    width: "100%",
    color: theme.palette.text.secondary,
  }));

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("customizer_collapse", isCollapse);
    }
  }, [isCollapse]);

  return (
    // ...existing code...
    <AppBarStyled position="sticky" color="default">
      <ToolbarStyled>
        {/* ------------------------------------------- */}
        {/* Toggle Button Sidebar */}
        {/* ------------------------------------------- */}
        <IconButton
          color="inherit"
          aria-label="menu"
          onClick={() => {
            // Toggle sidebar on both mobile and desktop based on screen size
            if (lgUp) {
              // For large screens, toggle between full-sidebar and mini-sidebar
              isCollapse === "full-sidebar"
                ? setIsCollapse("mini-sidebar")
                : setIsCollapse("full-sidebar");
            } else {
              // For smaller screens, toggle mobile sidebar
              setIsMobileSidebar(!isMobileSidebar);
            }
          }}
        >
          <IconMenu2 size="20" />
        </IconButton>

        {/* ------------------------------------------- */}
        {/* Search Dropdown */}
        {/* ------------------------------------------- */}
        <Search />
        {/* {lgUp ? (
              <>
                <Navigation />
              </>
            ) : null} */}

        <Box
          sx={{
            flexGrow: 1,
          }}
        />
        <Stack
          spacing={1}
          direction="row"
          sx={{
            alignItems: "center",
          }}
        >
          <Language />
          {/* <Cart /> */}

          <IconButton size="large" color="inherit">
            {activeMode === "light" ? (
              <IconMoon
                size="21"
                stroke="1.5"
                onClick={() => setActiveMode("dark")}
              />
            ) : (
              <IconSun
                size="21"
                stroke="1.5"
                onClick={() => setActiveMode("light")}
              />
            )}
          </IconButton>

          {/* <Notifications /> */}
          {/* {lgDown ? <MobileRightSidebar /> : null} */}
          <Profile />
        </Stack>
      </ToolbarStyled>
    </AppBarStyled>
    // ...existing code...
  );
};

export default Header;
