import React from "react";
import { Card, CardContent, Typography, Box, Divider, Avatar, Stack, Grid } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import BadgeIcon from "@mui/icons-material/Badge";
import PhoneIcon from "@mui/icons-material/Phone";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { useAuthCustom } from "app/contexts/AuthContext";

export default function UserProfile() {
  const { user } = useAuthCustom();

  if (!user) return <Typography>Không tìm thấy thông tin người dùng.</Typography>;

  return (
    <Box sx={{ maxWidth: 420, mx: "auto", mt: 6 }}>
      <Card sx={{ borderRadius: 4, boxShadow: 3, bgcolor: "background.paper" }}>
        <CardContent>
          <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
            <Avatar sx={{ width: 96, height: 96, mb: 2, bgcolor: "primary.main", fontSize: 48 }}>
              {user.avatar ? (
                <img src={user.avatar} alt="avatar" style={{ width: "100%", height: "100%" }} />
              ) : (
                <PersonIcon fontSize="inherit" />
              )}
            </Avatar>
            <Typography variant="h5" fontWeight={700} mb={0.5} textAlign="center">
              {user.full_name || user.username}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" mb={1}>
              <AssignmentIndIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: "middle" }} />
              {user.role}
            </Typography>
            <Divider sx={{ width: "100%", mb: 2 }} />
          </Box>
          <Stack spacing={2}>
            <Grid container alignItems="center">
              <Grid item xs={2} textAlign="center">
                <BadgeIcon color="primary" />
              </Grid>
              <Grid item xs={10}>
                <Typography>
                  <b>Username:</b> {user.username}
                </Typography>
              </Grid>
            </Grid>
            <Grid container alignItems="center">
              <Grid item xs={2} textAlign="center">
                <EmailIcon color="primary" />
              </Grid>
              <Grid item xs={10}>
                <Typography>
                  <b>Email:</b> {user.email}
                </Typography>
              </Grid>
            </Grid>
            <Grid container alignItems="center">
              <Grid item xs={2} textAlign="center">
                <PersonIcon color="primary" />
              </Grid>
              <Grid item xs={10}>
                <Typography>
                  <b>Họ tên:</b> {user.full_name}
                </Typography>
              </Grid>
            </Grid>
            <Grid container alignItems="center">
              <Grid item xs={2} textAlign="center">
                <PhoneIcon color="primary" />
              </Grid>
              <Grid item xs={10}>
                <Typography>
                  <b>Điện thoại:</b> {user.phone}
                </Typography>
              </Grid>
            </Grid>
            <Grid container alignItems="center">
              <Grid item xs={2} textAlign="center">
                <VerifiedUserIcon color={user.is_active ? "success" : "error"} />
              </Grid>
              <Grid item xs={10}>
                <Typography>
                  <b>Trạng thái:</b> {user.status || (user.is_active ? "Hoạt động" : "Khoá")}
                </Typography>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
