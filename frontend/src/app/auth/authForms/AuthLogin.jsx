"use client";

import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/app/context/AuthContext";
import {
  Box,
  Button,
  Typography,
  Stack,
  FormControlLabel,
  FormGroup,
  TextField,
} from "@mui/material";
import Link from "next/link";
import CustomCheckbox from "@/app/components/forms/theme-elements/CustomCheckbox";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";

const AuthLogin = ({ title, subtitle, subtext }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tenantCode, setTenantCode] = useState("root");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useContext(AuthContext);
  const router = useRouter();

  const validate = () => {
    const errs = {};
    if (!username.trim()) errs.username = "Vui lòng nhập tên tài khoản";
    if (!password) errs.password = "Vui lòng nhập mật khẩu";
    if (!tenantCode.trim()) errs.tenantCode = "Vui lòng nhập mã tenant";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login(username.trim(), password, rememberDevice, tenantCode.trim());
      router.push("/apps/chats");
    } catch {
      // snackbar shown in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off" noValidate>
      {title && (
        <Typography variant="h4" fontWeight={700} mb={1} sx={{ color: "text.primary" }}>
          {title}
        </Typography>
      )}
      {subtext}

      <Stack spacing={2}>
        <Box>
          <CustomFormLabel htmlFor="tenant_code">Mã Tenant</CustomFormLabel>
          <CustomTextField
            id="tenant_code"
            variant="outlined"
            fullWidth
            value={tenantCode}
            onChange={(e) => {
              setTenantCode(e.target.value);
              if (errors.tenantCode) setErrors((p) => ({ ...p, tenantCode: "" }));
            }}
            placeholder="VD: root, default, company"
            error={!!errors.tenantCode}
            helperText={errors.tenantCode}
            disabled={loading}
            autoComplete="off"
          />
        </Box>

        <Box>
          <CustomFormLabel htmlFor="username">Tài khoản</CustomFormLabel>
          <CustomTextField
            id="username"
            variant="outlined"
            fullWidth
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (errors.username) setErrors((p) => ({ ...p, username: "" }));
            }}
            autoComplete="username"
            error={!!errors.username}
            helperText={errors.username}
            disabled={loading}
          />
        </Box>

        <Box>
          <CustomFormLabel htmlFor="password">Mật khẩu</CustomFormLabel>
          <CustomTextField
            id="password"
            type="password"
            variant="outlined"
            fullWidth
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((p) => ({ ...p, password: "" }));
            }}
            autoComplete="current-password"
            error={!!errors.password}
            helperText={errors.password}
            disabled={loading}
          />
        </Box>

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          my={0.5}
        >
          <FormGroup>
            <FormControlLabel
              control={
                <CustomCheckbox
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  disabled={loading}
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  Ghi nhớ đăng nhập
                </Typography>
              }
            />
          </FormGroup>
        </Stack>
      </Stack>

      <Box mt={2}>
        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          type="submit"
          disabled={loading}
          sx={{
            py: 1.5,
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </Box>
      {subtitle}
    </form>
  );
};

export default AuthLogin;
