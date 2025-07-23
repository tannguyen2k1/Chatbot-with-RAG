import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from "next/link";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import { Stack } from "@mui/system";

const AuthTwoSteps = () => (
  <>
    <Box sx={{
      mt: 4
    }}>
      <Stack sx={{
        mb: 3
      }}>
        <CustomFormLabel htmlFor="code">
          Type your 6 digits security code{" "}
        </CustomFormLabel>
        <Stack spacing={2} direction="row">
          <CustomTextField id="code" variant="outlined" fullWidth />
          <CustomTextField id="code" variant="outlined" fullWidth />
          <CustomTextField id="code" variant="outlined" fullWidth />
          <CustomTextField id="code" variant="outlined" fullWidth />
          <CustomTextField id="code" variant="outlined" fullWidth />
          <CustomTextField id="code" variant="outlined" fullWidth />
        </Stack>
      </Stack>
      <Button
        color="primary"
        variant="contained"
        size="large"
        fullWidth
        component={Link}
        href="/"
      >
        Verify My Account
      </Button>

      <Stack direction="row" spacing={1} sx={{
        mt: 3
      }}>
        <Typography color="textSecondary" variant="h6" sx={{
          fontWeight: "400"
        }}>
          Didn&apos;t get the code?
        </Typography>
        <Typography
          component={Link}
          href="/"
          sx={{
            fontWeight: "500",
            textDecoration: "none",
            color: "primary.main"
          }}>
          Resend
        </Typography>
      </Stack>
    </Box>
  </>
);

export default AuthTwoSteps;
