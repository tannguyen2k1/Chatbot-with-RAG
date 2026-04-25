import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  IconPower,
  IconUser,
  IconSettings,
  IconKey,
} from "@tabler/icons-react";
import { useContext, useState } from "react";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import { AuthContext } from "@/app/context/AuthContext";
import ChangePasswordDialog from "@/app/components/user/ChangePasswordDialog";
import ProfileDialog from "@/app/components/user/ProfileDialog";

export const Profile = () => {
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const { isSidebarHover, isCollapse } = useContext(CustomizerContext);
  const hideMenu = lgUp ? isCollapse == "mini-sidebar" && !isSidebarHover : "";
  const { user, logout } = useContext(AuthContext);

  const [anchorEl, setAnchorEl] = useState(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  // Luôn hiển thị profile box (không ẩn theo collapse state)
  // Chỉ ẩn menu items khi sidebar mini và không hover

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          m: 3,
          p: 1.5,
          borderRadius: 2,
          cursor: "pointer",
          bgcolor: "secondary.light",
          transition: "all 0.2s",
          "&:hover": { bgcolor: "action.hover" },
        }}
        onClick={handleMenuOpen}
      >
        <Avatar
          alt={user?.full_name || user?.username || "User"}
          src={"/images/profile/user-1.jpg"}
          sx={{ height: 40, width: 40 }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            noWrap
            sx={{ color: "text.primary" }}
          >
            {user?.full_name || user?.username || "User"}
          </Typography>
          <Typography
            variant="caption"
            noWrap
            sx={{ color: "text.secondary" }}
          >
            {user?.email || ""}
          </Typography>
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: "left", vertical: "bottom" }}
        anchorOrigin={{ horizontal: "left", vertical: "top" }}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 0.5,
            minWidth: 200,
            borderRadius: 2,
            overflow: "visible",
            "&::before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              left: 14,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
              boxShadow: 1,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {user?.full_name || user?.username || "User"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email || "No email"}
          </Typography>
        </Box>
        <Divider />

        <MenuItem
          onClick={() => {
            handleMenuClose();
            setProfileOpen(true);
          }}
        >
          <ListItemIcon>
            <IconUser size={20} />
          </ListItemIcon>
          <ListItemText>Hồ sơ</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <IconSettings size={20} />
          </ListItemIcon>
          <ListItemText>Cài đặt</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleMenuClose();
            setChangePasswordOpen(true);
          }}
        >
          <ListItemIcon>
            <IconKey size={20} />
          </ListItemIcon>
          <ListItemText>Đổi mật khẩu</ListItemText>
        </MenuItem>

        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <IconPower size={20} color="error" />
          </ListItemIcon>
          <ListItemText>Đăng xuất</ListItemText>
        </MenuItem>
      </Menu>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
      <ProfileDialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  );
};
