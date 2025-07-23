import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Drawer from "@mui/material/Drawer";
import useMediaQuery from "@mui/material/useMediaQuery";
import NavListing from "./NavListing/NavListing";
import Logo from "../../shared/logo/Logo";
import { CustomizerContext } from '@/app/context/customizerContext';
import { useContext } from 'react';
import config from '@/app/context/config';
import SidebarItems from "../../vertical/sidebar/SidebarItems";

const Navigation = () => {
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const { activeMode, isLayout, isMobileSidebar, setIsMobileSidebar } = useContext(CustomizerContext);
  const SidebarWidth = config.sidebarWidth;

  if (lgUp) {
    return (
      (<Box
        sx={{
          py: 2,
          borderBottom: "1px solid rgba(0,0,0,0.05)"
        }}>
        {/* ------------------------------------------- */}
        {/* Sidebar for desktop */}
        {/* ------------------------------------------- */}
        <Container
          sx={{
            maxWidth: isLayout === "boxed" ? "lg" : "100%!important",
          }}
        >
          <NavListing />
        </Container>
      </Box>)
    );
  }

  return (
    <Drawer
        anchor="left"
        open={isMobileSidebar}
        onClose={() => setIsMobileSidebar(false)}
        variant="temporary"
        slotProps={{
          paper: {
            sx: {
              width: SidebarWidth,
              border: "0 !important",
              boxShadow: (theme) => theme.shadows[8],
            },
          }
        }}
      >
      {/* ------------------------------------------- */}
      {/* Logo */}
      {/* ------------------------------------------- */}
      <Box sx={{
        px: 2
      }}>
        <Logo />
      </Box>
      {/* ------------------------------------------- */}
      {/* Sidebar For Mobile */}
      {/* ------------------------------------------- */}
      <SidebarItems />
    </Drawer>
  );
};

export default Navigation;
