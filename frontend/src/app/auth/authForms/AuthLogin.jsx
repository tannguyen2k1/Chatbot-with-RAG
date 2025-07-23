"use client";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import CustomCheckbox from '@/app/components/forms/theme-elements/CustomCheckbox';
import CustomTextField from '@/app/components/forms/theme-elements/CustomTextField';
import CustomFormLabel from '@/app/components/forms/theme-elements/CustomFormLabel';
import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { UserDataContext } from '@/app/context/UserDataContext';


const AuthLogin = ({ title, subtitle, subtext }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useContext(UserDataContext);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await login(username, password);
    setLoading(false);
    if (res.success) {
      router.push('/');
    } else {
      setError(res.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off">
      {title ? (
        <Typography
          variant="h3"
          sx={{
            fontWeight: "700",
            mb: 1
          }}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      <Stack>
        <Box>
          <CustomFormLabel htmlFor="username">Username</CustomFormLabel>
          <CustomTextField
            id="username"
            variant="outlined"
            fullWidth
            value={username}
            onChange={e => setUsername(e.target.value)}
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
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={loading}
          />
        </Box>
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            my: 2
          }}>
          <FormGroup>
            <FormControlLabel
              control={<CustomCheckbox defaultChecked disabled={loading} />}
              label="Remeber this Device"
            />
          </FormGroup>
          <Typography
            component={Link}
            href="/auth/auth1/forgot-password"
            sx={{
              fontWeight: "500",
              textDecoration: 'none',
              color: 'primary.main'
            }}>
            Forgot Password ?
          </Typography>
        </Stack>
      </Stack>
      {error && (
        <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>
      )}
      <Box sx={{ mt: 2 }}>
        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          type="submit"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
      </Box>
      {subtitle}
    </form>
  );
};

export default AuthLogin;
