import { NavLink, useNavigate } from "react-router-dom";
import { Formik } from "formik";
import * as Yup from "yup";

import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid2";
import styled from "@mui/material/styles/styled";
import useTheme from "@mui/material/styles/useTheme";
import LoadingButton from "@mui/lab/LoadingButton";

import { useAuthCustom } from "app/contexts/AuthContext";
import { Paragraph } from "app/components/Typography";

// STYLED COMPONENTS
const FlexBox = styled(Box)(() => ({
  display: "flex"
}));

const ContentBox = styled("div")(() => ({
  height: "100%",
  padding: "32px",
  position: "relative",
  background: "rgba(0, 0, 0, 0.01)"
}));

const StyledRoot = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#1A2038",
  minHeight: "100% !important",
  "& .card": {
    maxWidth: 800,
    minHeight: 400,
    margin: "1rem",
    display: "flex",
    borderRadius: 12,
    alignItems: "center"
  },

  ".img-wrapper": {
    height: "100%",
    minWidth: 320,
    display: "flex",
    padding: "2rem",
    alignItems: "center",
    justifyContent: "center"
  }
}));

// initial login credentials
const initialValues = {
  username: "",
  password: "",
  remember: true
};

// form field validation schema
const validationSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, "Password must be 6 character length")
    .required("Password is required!"),
  username: Yup.string().required("Username is required!")
});

export default function JwtLogin() {
  const theme = useTheme();
  const navigate = useNavigate();

  const { login } = useAuthCustom();

  const handleFormSubmit = async (values) => {
    try {
      await login(values.username, values.password);
      navigate("/");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <StyledRoot>
      <Card className="card">
        <Grid container>
          <Grid size={{ sm: 6, xs: 12 }}>
            <div className="img-wrapper">
              <img src="/assets/images/illustrations/dreamer.svg" width="100%" alt="" />
            </div>
          </Grid>

          <Grid size={{ sm: 6, xs: 12 }}>
            <ContentBox>
              <Formik
                onSubmit={handleFormSubmit}
                initialValues={initialValues}
                validationSchema={validationSchema}>
                {({
                  values,
                  errors,
                  touched,
                  isSubmitting,
                  handleChange,
                  handleBlur,
                  handleSubmit
                }) => (
                  <form onSubmit={handleSubmit}>
                    <TextField
                      fullWidth
                      size="small"
                      name="username"
                      label="Username"
                      variant="outlined"
                      onBlur={handleBlur}
                      value={values.username}
                      onChange={handleChange}
                      helperText={touched.username && errors.username}
                      error={Boolean(errors.username && touched.username)}
                      sx={{ mb: 3 }}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      name="password"
                      type="password"
                      label="Password"
                      variant="outlined"
                      onBlur={handleBlur}
                      value={values.password}
                      onChange={handleChange}
                      helperText={touched.password && errors.password}
                      error={Boolean(errors.password && touched.password)}
                      sx={{ mb: 1.5 }}
                    />

                    <FlexBox justifyContent="space-between">
                      <FlexBox gap={1}>
                        <Checkbox
                          size="small"
                          name="remember"
                          onChange={handleChange}
                          checked={values.remember}
                          sx={{ padding: 0 }}
                        />

                        <Paragraph>Remember Me</Paragraph>
                      </FlexBox>

                      <NavLink
                        to="/session/forgot-password"
                        style={{ color: theme.palette.primary.main }}>
                        Forgot password?
                      </NavLink>
                    </FlexBox>

                    <LoadingButton
                      type="submit"
                      color="primary"
                      loading={isSubmitting}
                      variant="contained"
                      sx={{ my: 2 }}>
                      Login
                    </LoadingButton>

                  </form>
                )}
              </Formik>
            </ContentBox>
          </Grid>
        </Grid>
      </Card>
    </StyledRoot>
  );
}
