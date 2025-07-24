import React, { useState, useContext, useEffect } from "react";
import { UserDataContext } from "@/app/context/UserDataContext";
import Link from "next/link";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Typography from "@mui/material/Typography";
import * as dropdownData from "./data";

import { IconMail } from "@tabler/icons-react";
import { Stack } from "@mui/system";

const Profile = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);
  const handleClick2 = (event) => {
    setAnchorEl2(event.currentTarget);
  };
  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const { user, logout } = useContext(UserDataContext);
  // State cho đồng hồ
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box>
      <IconButton
        aria-label="show 11 new notifications"
        color="inherit"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{
          ...(typeof anchorEl2 === "object" && {
            color: "primary.main",
          }),
        }}
        onClick={handleClick2}
      >
        <Avatar
          src={"/images/profile/user-1.jpg"}
          alt={user?.full_name || user?.username || "ProfileImg"}
          sx={{
            width: 35,
            height: 35,
          }}
        />
      </IconButton>
      <Menu
        id="msgs-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        sx={{
          "& .MuiMenu-paper": {
            width: "360px",
            p: 4,
          },
        }}
      >
        <Typography variant="h5">User Profile</Typography>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            py: 3,
            alignItems: "center",
          }}
        >
          <Avatar
            src={"/images/profile/user-1.jpg"}
            alt={user?.full_name || user?.username || "ProfileImg"}
            sx={{ width: 95, height: 95 }}
          />
          <Box>
            <Typography
              variant="subtitle2"
              color="textPrimary"
              sx={{ fontWeight: 600 }}
            >
              {user?.full_name || user?.username || "User"}
            </Typography>
            <Typography
              variant="subtitle2"
              color={
                user?.roles?.includes("root")
                  ? "error"
                  : user?.roles?.includes("admin")
                  ? "warning"
                  : "secondary"
              }
              sx={{ fontWeight: 500 }}
            >
              {user?.roles ? user.roles.join(", ") : ""}
            </Typography>
            <Typography
              variant="subtitle2"
              color="textSecondary"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <IconMail width={15} height={15} />
              {user?.email || ""}
            </Typography>
          </Box>
        </Stack>
        <Divider />
        {dropdownData.profile.map((profile) => (
          <Box key={profile.title}>
            <Box sx={{ py: 2, px: 0 }} className="hover-text-primary">
              <Link href={profile.href}>
                <Stack direction="row" spacing={2}>
                  <Box
                    sx={{
                      width: "45px",
                      height: "45px",
                      bgcolor: "primary.light",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: "0",
                    }}
                  >
                    <Avatar
                      src={profile.icon}
                      alt={profile.icon}
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 0,
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="textPrimary"
                      className="text-hover"
                      noWrap
                      sx={{
                        fontWeight: 600,
                        width: "240px",
                      }}
                    >
                      {profile.title}
                    </Typography>
                    <Typography
                      color="textSecondary"
                      variant="subtitle2"
                      sx={{
                        width: "240px",
                      }}
                      noWrap
                    >
                      {profile.subtitle}
                    </Typography>
                  </Box>
                </Stack>
              </Link>
            </Box>
          </Box>
        ))}
        <Box sx={{ mt: 2 }}>
          <Box
            sx={{
              bgcolor: "#f5f8ff",
              borderRadius: 3,
              border: "1px solid #e3e8ee",
              p: 2.5,
              mb: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxShadow: "0 2px 8px 0 rgba(60,72,120,0.06)",
              minWidth: 220,
            }}
          >
            <Typography
              variant="subtitle2"
              color="primary"
              fontWeight={600}
              mb={0.5}
            >
              {now.toLocaleDateString("vi-VN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={700}
              color="text.primary"
              sx={{ mt: 0.5, letterSpacing: 2 }}
            >
              {now.toLocaleTimeString("vi-VN", { hour12: false })}
            </Typography>
          </Box>
          <Button
            onClick={logout}
            variant="outlined"
            color="primary"
            fullWidth
          >
            Logout
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default Profile;
