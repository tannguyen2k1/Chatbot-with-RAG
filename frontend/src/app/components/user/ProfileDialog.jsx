"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Avatar,
  Stack,
  Box,
  Grid,
} from "@mui/material";
import { useState, useContext, useEffect } from "react";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import { IconX, IconCamera } from "@tabler/icons-react";
import { AuthContext } from "@/app/context/AuthContext";

const ProfileDialog = ({ open, onClose }) => {
  const { user, updateProfile } = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open && user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      setAvatarPreview(null);
    }
  }, [open, user]);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.full_name?.trim()) {
      newErrors.full_name = "Vui lòng nhập họ tên";
    }
    if (!formData.email?.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await updateProfile({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
      });
      onClose();
    } catch (e) {
      // Error handled by context snackbar
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pr: 1,
        }}
      >
        Hồ sơ cá nhân
        <IconButton onClick={handleClose} size="small">
          <IconX size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Avatar */}
          <Box sx={{ textAlign: "center" }}>
            <Box
              sx={{
                position: "relative",
                display: "inline-block",
              }}
            >
              <Avatar
                src={avatarPreview || "/images/profile/user-1.jpg"}
                alt={formData.full_name}
                sx={{
                  width: 100,
                  height: 100,
                  mx: "auto",
                  border: "3px solid",
                  borderColor: "primary.light",
                }}
              />
              <Box
                component="label"
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  bgcolor: "primary.main",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "white",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                <IconCamera size={16} />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarChange}
                />
              </Box>
            </Box>
          </Box>

          {/* Form fields */}
          <Grid container spacing={2}>
            <Grid size={12}>
              <CustomFormLabel htmlFor="pd-fullname">Họ và tên</CustomFormLabel>
              <CustomTextField
                id="pd-fullname"
                value={formData.full_name}
                onChange={handleChange("full_name")}
                error={!!errors.full_name}
                helperText={errors.full_name}
                fullWidth
              />
            </Grid>

            <Grid size={12}>
              <CustomFormLabel htmlFor="pd-email">Email</CustomFormLabel>
              <CustomTextField
                id="pd-email"
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                error={!!errors.email}
                helperText={errors.email}
                fullWidth
              />
            </Grid>

            <Grid size={12}>
              <CustomFormLabel htmlFor="pd-phone">Số điện thoại</CustomFormLabel>
              <CustomTextField
                id="pd-phone"
                value={formData.phone}
                onChange={handleChange("phone")}
                fullWidth
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={handleClose} disabled={isSubmitting}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileDialog;
