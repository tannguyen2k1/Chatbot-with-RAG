import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useContext } from 'react'
import { IconPower } from '@tabler/icons-react';
import Link from 'next/link';
import { CustomizerContext } from '@/app/context/customizerContext'

export const Profile = () => {


  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  const { isSidebarHover, isCollapse } = useContext(CustomizerContext);
  const hideMenu = lgUp ? isCollapse == 'mini-sidebar' && !isSidebarHover : '';

  return (
    (<Box
      sx={{
        display: 'flex',
        alignItems: "center",
        gap: 2,
        m: 3,
        p: 2,
        bgcolor: `${'secondary.light'}`
      }}>
      {!hideMenu ? (
        <>
          <Avatar alt="Remy Sharp" src={"/images/profile/user-1.jpg"} sx={{ height: 40, width: 40 }} />

          <Box>
            <Typography variant="h6">Mathew</Typography>
            <Typography variant="caption">Designer</Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Tooltip title="Logout" placement="top">
              <IconButton
                color="primary"
                component={Link}
                href="/auth/auth1/login"
                aria-label="logout"
                size="small"
              >
                <IconPower size="20" />
              </IconButton>
            </Tooltip>
          </Box>
        </>
      ) : (
        ''
      )}
    </Box>)
  );
};
