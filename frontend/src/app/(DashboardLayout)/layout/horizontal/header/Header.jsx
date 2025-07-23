import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { styled } from '@mui/material/styles';
import { ProductProvider } from '@/app/context/Ecommercecontext/index'
import { CustomizerContext } from "@/app/context/customizerContext";
import config from "@/app/context/config";

import { IconMenu2, IconMoon, IconSun } from '@tabler/icons-react';
import Notifications from '../../vertical/header/Notification';

import Profile from '../../vertical/header/Profile';
import Search from '../../vertical/header/Search';
import Language from '../../vertical/header/Language';
import Navigation from '../../vertical/header/Navigation';
import Logo from '../../shared/logo/Logo';
import Cart from '../../vertical/header/Cart';

const Header = () => {
  const lgDown = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));

  // drawer
  const { isLayout, setIsMobileSidebar, isMobileSidebar, activeMode, setActiveMode } = React.useContext(CustomizerContext);
  const TopbarHeight = config.topbarHeight;

  const AppBarStyled = styled(AppBar)(({ theme }) => ({
    background: theme.palette.background.paper,
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',

    [theme.breakpoints.up('lg')]: {
      minHeight: TopbarHeight,
    },
  }));
  const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    margin: '0 auto',
    width: '100%',
    color: `${theme.palette.text.secondary} !important`,
  }));

  return (
    (
      <ProductProvider>

        <AppBarStyled position="sticky" color="default" elevation={8}>
          <ToolbarStyled
            sx={{
              maxWidth: isLayout === 'boxed' ? 'lg' : '100%!important',
            }}
          >
            <Box sx={{ width: lgDown ? '45px' : 'auto', overflow: 'hidden' }}>
              <Logo />
            </Box>
            {/* ------------------------------------------- */}
            {/* Toggle Button Sidebar */}
            {/* ------------------------------------------- */}
            {lgDown ? (
              <IconButton
                color="inherit"
                aria-label="menu"
                onClick={() => setIsMobileSidebar(!isMobileSidebar)}

              >
                <IconMenu2 />
              </IconButton>
            ) : (
              ''
            )}
            {/* ------------------------------------------- */}
            {/* Search Dropdown */}
            {/* ------------------------------------------- */}
            <Search />
            {lgUp ? (
              <>
                <Navigation />
              </>
            ) : null}
            <Box sx={{
              flexGrow: 1
            }} />
            <Stack spacing={1} direction="row" sx={{
              alignItems: "center"
            }}>
              <Language />
              {/* ------------------------------------------- */}
              {/* Ecommerce Dropdown */}
              {/* ------------------------------------------- */}
              <Cart />
              {/* ------------------------------------------- */}
              {/* End Ecommerce Dropdown */}
              {/* ------------------------------------------- */}
              <IconButton size="large" color="inherit">
                {activeMode === 'light' ? (
                  <IconMoon size="21" stroke="1.5" onClick={() => setActiveMode("dark")} />
                ) : (
                  <IconSun size="21" stroke="1.5" onClick={() => setActiveMode("light")} />
                )}
              </IconButton>

              <Notifications />
              <Profile />
            </Stack>
          </ToolbarStyled>
        </AppBarStyled>
      </ProductProvider>
    )
  );
};

export default Header;
