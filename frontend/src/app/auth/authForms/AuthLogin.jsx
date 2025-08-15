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
} from "@mui/material";
import Link from "next/link";
import CustomCheckbox from "@/app/components/forms/theme-elements/CustomCheckbox";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";

const AuthLogin = ({ title, subtitle, subtext }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password); // AuthContext sẽ tự hiện snackbar
      router.push("/");
    } catch {
      // Không cần xử lý error ở đây vì snackbar đã hiện trong AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off">
      {title && (
        <Typography variant="h3" fontWeight={700} mb={1}>
          {title}
        </Typography>
      )}
      {subtext}

      <Stack>
        <Box>
          <CustomFormLabel htmlFor="username">Username</CustomFormLabel>
          <CustomTextField
            id="username"
            variant="outlined"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            disabled={loading}
          />
        </Box>
        <Box>
          <CustomFormLabel htmlFor="password">Password</CustomFormLabel>
          <CustomTextField
            id="password"
            type="password"
            variant="outlined"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={loading}
          />
        </Box>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          my={2}
        >
          <FormGroup>
            <FormControlLabel
              control={<CustomCheckbox defaultChecked disabled={loading} />}
              label="Remember this Device"
            />
          </FormGroup>
          <Typography
            component={Link}
            href="/auth/auth1/forgot-password"
            fontWeight={500}
            sx={{
              textDecoration: "none",
              color: "primary.main",
            }}
          >
            Forgot Password ?
          </Typography>
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
        >
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </Box>
      {subtitle}
    </form>
  );
};

export default AuthLogin;
