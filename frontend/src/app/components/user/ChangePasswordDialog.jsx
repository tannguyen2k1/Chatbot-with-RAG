"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  Box,
} from "@mui/material";
import { useState, useContext } from "react";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import { IconX, IconEye, IconEyeOff } from "@tabler/icons-react";
import { AuthContext } from "@/app/context/AuthContext";

const ChangePasswordDialog = ({ open, onClose }) => {
  const { changePassword } = useContext(AuthContext);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.current_password) {
      newErrors.current_password = "Vui lòng nhập mật khẩu hiện tại";
    }
    if (!formData.new_password) {
      newErrors.new_password = "Vui lòng nhập mật khẩu mới";
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = "Mật khẩu mới phải có ít nhất 8 ký tự";
    }
    if (!formData.confirm_password) {
      newErrors.confirm_password = "Vui lòng xác nhận mật khẩu mới";
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = "Mật khẩu xác nhận không khớp";
    }
    if (formData.current_password === formData.new_password) {
      newErrors.new_password = "Mật khẩu mới phải khác mật khẩu hiện tại";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password,
      });
      handleClose();
    } catch (e) {
      // Error handled by context snackbar
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ current_password: "", new_password: "", confirm_password: "" });
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
        Đổi mật khẩu
        <IconButton onClick={handleClose} size="small">
          <IconX size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Box>
            <CustomFormLabel htmlFor="cp-current">
              Mật khẩu hiện tại
            </CustomFormLabel>
            <CustomTextField
              id="cp-current"
              type={showCurrent ? "text" : "password"}
              value={formData.current_password}
              onChange={handleChange("current_password")}
              error={!!errors.current_password}
              helperText={errors.current_password}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowCurrent(!showCurrent)}
                        edge="end"
                        size="small"
                      >
                        {showCurrent ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Box>
            <CustomFormLabel htmlFor="cp-new">Mật khẩu mới</CustomFormLabel>
            <CustomTextField
              id="cp-new"
              type={showNew ? "text" : "password"}
              value={formData.new_password}
              onChange={handleChange("new_password")}
              error={!!errors.new_password}
              helperText={errors.new_password}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNew(!showNew)}
                        edge="end"
                        size="small"
                      >
                        {showNew ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Box>
            <CustomFormLabel htmlFor="cp-confirm">
              Xác nhận mật khẩu mới
            </CustomFormLabel>
            <CustomTextField
              id="cp-confirm"
              type={showConfirm ? "text" : "password"}
              value={formData.confirm_password}
              onChange={handleChange("confirm_password")}
              error={!!errors.confirm_password}
              helperText={errors.confirm_password}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirm(!showConfirm)}
                        edge="end"
                        size="small"
                      >
                        {showConfirm ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
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
          {isSubmitting ? "Đang xử lý..." : "Đổi mật khẩu"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordDialog;
