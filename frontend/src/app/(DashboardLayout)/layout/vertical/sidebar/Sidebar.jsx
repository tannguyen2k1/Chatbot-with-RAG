import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import SidebarItems from './SidebarItems';
import Logo from '../../shared/logo/Logo';
import Scrollbar from '@/app/components/custom-scroll/Scrollbar';
import { Profile } from './SidebarProfile/Profile';
import { useContext } from "react";
import { CustomizerContext } from "@/app/context/customizerContext";
import config from '@/app/context/config'

const Sidebar = () => {
  const lgUp = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const {
    isCollapse,
    isSidebarHover,
    setIsSidebarHover,
    isMobileSidebar,
    setIsMobileSidebar,
  } = useContext(CustomizerContext);
  const MiniSidebarWidth = config.miniSidebarWidth;
  const SidebarWidth = config.sidebarWidth;

  const theme = useTheme();
  const toggleWidth =
    isCollapse == "mini-sidebar" && !isSidebarHover
      ? MiniSidebarWidth
      : SidebarWidth;

  const onHoverEnter = () => {
    if (isCollapse == "mini-sidebar") {
      setIsSidebarHover(true);
    }
  };

  const onHoverLeave = () => {
    setIsSidebarHover(false);
  };


  return (
    <>
      {!lgUp ?
        <Box
          sx={{
            zIndex: 100,
            width: toggleWidth,
            flexShrink: 0,
            ...(isCollapse == "mini-sidebar" && {
              position: 'absolute',
            }),
          }}
        >
          {/* ------------------------------------------- */}
          {/* Sidebar for desktop */}
          {/* ------------------------------------------- */}
          <Drawer
            anchor="left"
            open
            onMouseEnter={onHoverEnter}
            onMouseLeave={onHoverLeave}
            variant="permanent"
            slotProps={{
              paper: {
                sx: {
                  transition: theme.transitions.create('width', {
                    duration: theme.transitions.duration.shortest,
                  }),
                  width: toggleWidth,
                  boxSizing: 'border-box',
                },
              }
            }}
          >
            {/* ------------------------------------------- */}
            {/* Sidebar Box */}
            {/* ------------------------------------------- */}
            <Box
              sx={{
                height: '100%',
              }}
            >
              {/* ------------------------------------------- */}
              {/* Logo */}
              {/* ------------------------------------------- */}
              <Box sx={{
                px: 3
              }}>
                <Logo />
              </Box>
              <Scrollbar sx={{ height: 'calc(100% - 190px)' }}>
                {/* ------------------------------------------- */}
                {/* Sidebar Items */}
                {/* ------------------------------------------- */}
                <SidebarItems />
              </Scrollbar>
              <Profile />
            </Box>
          </Drawer>
        </Box>
        :
        <Drawer
          anchor="left"
          open={isMobileSidebar}
          onClose={() => setIsMobileSidebar(false)}
          variant="temporary"
          slotProps={{
            paper: {
              sx: {
                width: SidebarWidth,
                border: '0 !important',
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
      }
    </>
  );
};

export default Sidebar;
