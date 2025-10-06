"use client";
import React, { useState, useEffect, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Grid,
} from "@mui/material";
import { IconEdit, IconUser, IconMail, IconPhone } from "@tabler/icons-react";
import { useAuth } from "@/app/context/AuthContext";
import { UserDataContext } from "@/app/context/UserDataContext";

const EditProfileDialog = ({ open, onClose }) => {
  const { updateProfile } = useAuth();
  const { user, refreshUserData } = useContext(UserDataContext);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleInputChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError("Vui lòng nhập email");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Email không hợp lệ");
      return false;
    }
    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      setError("Số điện thoại không hợp lệ");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await updateProfile(formData);
      await refreshUserData(); // Refresh user data after update
      
      setSuccess(true);
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "Có lỗi xảy ra khi cập nhật thông tin");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError("");
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pb: 1,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <IconEdit size={24} />
        <Box component="span" sx={{ fontWeight: 600 }}>
          Chỉnh sửa thông tin cá nhân
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Cập nhật thông tin thành công!
          </Alert>
        )}

        <Grid container mt={3} spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Họ và tên"
              value={formData.full_name}
              onChange={handleInputChange("full_name")}
              fullWidth
              disabled={loading}
              InputProps={{
                startAdornment: <IconUser size={20} style={{ marginRight: 8 }} />,
              }}
              helperText="Tên hiển thị của bạn"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange("email")}
              fullWidth
              disabled={loading}
              required
              InputProps={{
                startAdornment: <IconMail size={20} style={{ marginRight: 8 }} />,
              }}
              helperText="Địa chỉ email của bạn"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Số điện thoại"
              value={formData.phone}
              onChange={handleInputChange("phone")}
              fullWidth
              disabled={loading}
              InputProps={{
                startAdornment: <IconPhone size={20} style={{ marginRight: 8 }} />,
              }}
              helperText="Số điện thoại liên lạc (tùy chọn)"
              placeholder="VD: 0123456789"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          color="inherit"
        >
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || success}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? "Đang xử lý..." : "Cập nhật"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProfileDialog;
