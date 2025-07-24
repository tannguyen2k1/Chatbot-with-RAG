"use client";
import React, { useContext } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
  Stack,
  Avatar,
  Tooltip,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import BadgeIcon from "@mui/icons-material/Badge";
import PhoneIcon from "@mui/icons-material/Phone";
import SecurityIcon from "@mui/icons-material/Security";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import StarIcon from "@mui/icons-material/Star";
import { UserDataContext } from "@/app/context/UserDataContext";

function UserInfoCard() {
  const { user, loading, error } = useContext(UserDataContext);
  if (loading)
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h6">Đang tải...</Typography>
      </Box>
    );
  if (error)
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography color="error">Lỗi: {error.message || error}</Typography>
      </Box>
    );
  if (!user)
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography>Không có dữ liệu người dùng.</Typography>
      </Box>
    );

  // Avatar fallback: lấy ký tự đầu username hoặc icon
  const avatarText = user.full_name?.[0] || user.username?.[0] || "?";
  const roleColor = user.role === "root" ? "warning" : "secondary";

  return (
    <Grid width={"100%"} container justifyContent="center" sx={{ mt: 4 }}>
      <Grid width={"100%"} item xs={12} md={8}>
        <Card
          elevation={4}
          sx={(theme) => ({
            borderRadius: 4,
            overflow: "visible",
            p: 0,
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #232a36 60%, #1e293b 100%)"
                : "linear-gradient(135deg, #f8fafc 60%, #e3f2fd 100%)",
          })}
        >
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <Box display="flex" alignItems="center" gap={3} mb={3}>
              <Avatar
                sx={(theme) => ({
                  width: 80,
                  height: 80,
                  fontSize: 36,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? theme.palette.primary.dark
                      : "#1976d2",
                  color:
                    theme.palette.mode === "dark"
                      ? theme.palette.primary.contrastText
                      : "#fff",
                  boxShadow: 3,
                  border: `4px solid ${
                    theme.palette.mode === "dark"
                      ? theme.palette.background.paper
                      : "#fff"
                  }`,
                })}
              >
                {avatarText}
              </Avatar>
              <Box flex={1}>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  color="primary.main"
                  mb={0.5}
                >
                  {user.full_name || user.username}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  <Tooltip title="Username">
                    <Chip
                      icon={<PersonIcon />}
                      label={user.username}
                      size="small"
                      sx={(theme) => ({
                        fontWeight: 500,
                        bgcolor:
                          theme.palette.mode === "dark" ? "#334155" : "#e3f2fd",
                        color:
                          theme.palette.mode === "dark"
                            ? theme.palette.primary.contrastText
                            : "#1976d2",
                      })}
                    />
                  </Tooltip>
                  <Tooltip title="Email">
                    <Chip
                      icon={<EmailIcon />}
                      label={user.email}
                      size="small"
                      sx={(theme) => ({
                        fontWeight: 500,
                        bgcolor:
                          theme.palette.mode === "dark" ? "#334155" : "#e3f2fd",
                        color:
                          theme.palette.mode === "dark"
                            ? theme.palette.primary.contrastText
                            : "#1976d2",
                      })}
                    />
                  </Tooltip>
                  <Tooltip title="Vai trò">
                    <Chip
                      icon={<SecurityIcon />}
                      label={
                        Array.isArray(user.roles) && user.roles.length > 0
                          ? user.roles[0]
                          : "-"
                      }
                      color={roleColor}
                      size="small"
                      sx={(theme) => ({
                        fontWeight: 500,
                        bgcolor:
                          theme.palette.mode === "dark" ? "#334155" : "#e3f2fd",
                        color:
                          theme.palette.mode === "dark"
                            ? theme.palette.primary.contrastText
                            : "#1976d2",
                      })}
                    />
                  </Tooltip>
                  <Tooltip title="Trạng thái">
                    <Chip
                      label={user.is_active ? "Hoạt động" : "Ngừng"}
                      color={user.is_active ? "success" : "default"}
                      size="small"
                      sx={(theme) => ({
                        fontWeight: 500,
                        bgcolor:
                          theme.palette.mode === "dark" ? "#334155" : "#e3f2fd",
                        color:
                          theme.palette.mode === "dark"
                            ? theme.palette.primary.contrastText
                            : "#1976d2",
                      })}
                    />
                  </Tooltip>
                  <Tooltip title="Số điện thoại">
                    <Chip
                      icon={<PhoneIcon />}
                      label={user.phone || "-"}
                      size="small"
                      sx={(theme) => ({
                        fontWeight: 500,
                        bgcolor:
                          theme.palette.mode === "dark" ? "#334155" : "#e3f2fd",
                        color:
                          theme.palette.mode === "dark"
                            ? theme.palette.primary.contrastText
                            : "#1976d2",
                      })}
                    />
                  </Tooltip>
                </Stack>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box>
              <Typography fontWeight={600} mb={1} color="primary">
                Quyền hạn:
              </Typography>
              {user.permissions && typeof user.permissions === "object" ? (
                <Box
                  sx={(theme) => ({
                    background:
                      theme.palette.mode === "dark" ? "#232a36" : "#f5f5f5",
                    p: 2,
                    borderRadius: 2,
                  })}
                >
                  <Grid container flexDirection={"column"} spacing={2}>
                    {Object.entries(user.permissions).map(([module, perms]) => (
                      <Grid item xs={12} sm={6} md={4} key={module}>
                        <Typography
                          variant="subtitle2"
                          color="primary"
                          fontWeight={600}
                          mb={0.5}
                          sx={{ letterSpacing: 1 }}
                        >
                          {module.toUpperCase()}
                        </Typography>
                        <Stack
                          direction="row"
                          flexWrap="wrap"
                          gap={1.2}
                          mt={1}
                          useFlexGap
                        >
                          {Array.isArray(perms) && perms.length > 0 ? (
                            perms.map((perm) => (
                              <Chip
                                key={perm}
                                label={perm.replace(module + ".", "• ")}
                                color="info"
                                size="small"
                                sx={(theme) => ({
                                  borderRadius: 2,
                                  fontWeight: 500,
                                  letterSpacing: 0.2,
                                  bgcolor:
                                    theme.palette.mode === "dark"
                                      ? "#334155"
                                      : "#e3f2fd",
                                  color:
                                    theme.palette.mode === "dark"
                                      ? theme.palette.primary.contrastText
                                      : "#1976d2",
                                  px: 1.5,
                                  mb: 0.5,
                                })}
                              />
                            ))
                          ) : (
                            <Chip label="Không có quyền" size="small" />
                          )}
                        </Stack>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <Typography color="text.secondary">
                  Không có quyền hạn.
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
export default UserInfoCard;
