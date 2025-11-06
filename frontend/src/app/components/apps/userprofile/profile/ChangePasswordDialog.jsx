"use client";
import React, { useState } from "react";
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
} from "@mui/material";
import { IconLock, IconEye, IconEyeOff } from "@tabler/icons-react";
import { useAuth } from "@/app/context/AuthContext";

const ChangePasswordDialog = ({ open, onClose }) => {
  const { changePassword } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword.trim()) {
      setError("Vui lòng nhập mật khẩu hiện tại");
      return false;
    }
    if (!formData.newPassword.trim()) {
      setError("Vui lòng nhập mật khẩu mới");
      return false;
    }
    if (formData.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return false;
    }
    if (formData.currentPassword === formData.newPassword) {
      setError("Mật khẩu mới phải khác mật khẩu hiện tại");
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
      await changePassword({
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
      });
      
      setSuccess(true);
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      // Không cần đóng dialog vì logout sẽ redirect về login page
      // Dialog sẽ tự động đóng khi redirect
    } catch (err) {
      setError(err.response?.data?.detail || "Có lỗi xảy ra khi đổi mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
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
        <IconLock size={24} />
        <Box component="span" sx={{ fontWeight: 600 }}>
          Đổi mật khẩu
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
            Đổi mật khẩu thành công! Bạn sẽ được chuyển đến trang đăng nhập...
          </Alert>
        )}

        <Box sx={{ display: "flex", mt: 3, flexDirection: "column", gap: 2 }}>
          <TextField
            label="Mật khẩu hiện tại"
            type={showPasswords.current ? "text" : "password"}
            value={formData.currentPassword}
            onChange={handleInputChange("currentPassword")}
            fullWidth
            disabled={loading}
            InputProps={{
              endAdornment: (
                <Button
                  size="small"
                  onClick={() => togglePasswordVisibility("current")}
                  sx={{ minWidth: "auto", p: 0.5 }}
                >
                  {showPasswords.current ? (
                    <IconEyeOff size={20} />
                  ) : (
                    <IconEye size={20} />
                  )}
                </Button>
              ),
            }}
          />

          <TextField
            label="Mật khẩu mới"
            type={showPasswords.new ? "text" : "password"}
            value={formData.newPassword}
            onChange={handleInputChange("newPassword")}
            fullWidth
            disabled={loading}
            helperText="Mật khẩu phải có ít nhất 6 ký tự"
            InputProps={{
              endAdornment: (
                <Button
                  size="small"
                  onClick={() => togglePasswordVisibility("new")}
                  sx={{ minWidth: "auto", p: 0.5 }}
                >
                  {showPasswords.new ? (
                    <IconEyeOff size={20} />
                  ) : (
                    <IconEye size={20} />
                  )}
                </Button>
              ),
            }}
          />

          <TextField
            label="Xác nhận mật khẩu mới"
            type={showPasswords.confirm ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleInputChange("confirmPassword")}
            fullWidth
            disabled={loading}
            InputProps={{
              endAdornment: (
                <Button
                  size="small"
                  onClick={() => togglePasswordVisibility("confirm")}
                  sx={{ minWidth: "auto", p: 0.5 }}
                >
                  {showPasswords.confirm ? (
                    <IconEyeOff size={20} />
                  ) : (
                    <IconEye size={20} />
                  )}
                </Button>
              ),
            }}
          />
        </Box>
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
          {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordDialog;
