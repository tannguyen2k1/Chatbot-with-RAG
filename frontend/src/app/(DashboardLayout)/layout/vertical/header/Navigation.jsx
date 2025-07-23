import { useState } from "react";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { Grid } from '@mui/material';
import Menu from '@mui/material/Menu';
import Typography from '@mui/material/Typography';
import Link from "next/link";
import { IconChevronDown, IconHelp } from "@tabler/icons-react";
import AppLinks from "./AppLinks";
import QuickLinks from "./QuickLinks";

const AppDD = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);

  const handleClick2 = (event) => {
    setAnchorEl2(event.currentTarget);
  };

  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  return (<>
    <Box>
      <Button
        aria-label="show 11 new notifications"
        color="inherit"
        variant="text"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{
          bgcolor: anchorEl2 ? "primary.light" : "",
          color: anchorEl2
            ? "primary.main"
            : (theme) => theme.palette.text.secondary,
        }}
        onClick={handleClick2}
        endIcon={
          <IconChevronDown
            size="15"
            style={{ marginLeft: "-5px", marginTop: "2px" }}
          />
        }
      >
        Apps
      </Button>
      {/* ------------------------------------------- */}
      {/* Message Dropdown */}
      {/* ------------------------------------------- */}
      <Menu
        id="msgs-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        transformOrigin={{ horizontal: "left", vertical: "top" }}
        sx={{
          "& .MuiMenu-paper": {
            width: "850px",
          },
          "& .MuiMenu-paper ul": {
            p: 0,
          },
        }}
      >
        <Grid container>
          <Grid
            size={{
              sm: 8
            }}
            sx={{
              display: "flex"
            }}>
            <Box
              sx={{
                p: 4,
                pr: 0,
                pb: 3
              }}>
              <AppLinks />
              <Divider />
              <Box
                sx={{
                  alignItems: "center",
                  justifyContent: "space-between",
                  pt: 2,
                  pr: 4,

                  display: {
                    xs: "none",
                    sm: "flex",
                  }
                }}>
                <Link href="/faq">
                  <Typography
                    variant="subtitle2"
                    color="textPrimary"
                    sx={{
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                    <IconHelp width={24} />
                    Frequently Asked Questions
                  </Typography>
                </Link>
                <Button variant="contained" color="primary">
                  Check
                </Button>
              </Box>
            </Box>
            <Divider orientation="vertical" />
          </Grid>
          <Grid
            size={{
              sm: 4
            }}>
            <Box sx={{
              p: 4
            }}>
              <QuickLinks />
            </Box>
          </Grid>
        </Grid>
      </Menu>
    </Box>
    <Button
      color="inherit"
      sx={{ color: (theme) => theme.palette.text.secondary }}
      variant="text"
      href="/apps/chats"
      component={Link}
    >
      Chat
    </Button>
    <Button
      color="inherit"
      sx={{ color: (theme) => theme.palette.text.secondary }}
      variant="text"
      href="/apps/calendar"
      component={Link}
    >
      Calendar
    </Button>
    <Button
      color="inherit"
      sx={{ color: (theme) => theme.palette.text.secondary }}
      variant="text"
      href="/apps/email"
      component={Link}
    >
      Email
    </Button>
  </>);
};

export default AppDD;
