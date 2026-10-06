"use client";

import Box from "@mui/material/Box";
import { Grid } from "@mui/material";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import PageContainer from "@/app/components/container/PageContainer";
import AuthLogin from "../authForms/AuthLogin";
import { UTC_BRAND } from "@/utils/brand/utc";

export default function Login() {
  const c = UTC_BRAND.colors;

  return (
    <PageContainer title="Đăng nhập" description={UTC_BRAND.product}>
      <Grid
        container
        spacing={0}
        sx={{
          justifyContent: "center",
          height: "100vh",
          bgcolor: c.primaryLight,
        }}
      >
        <Grid
          sx={{
            position: "relative",
            overflow: "hidden",
            background: `linear-gradient(160deg, ${c.primaryDark} 0%, ${c.primary} 48%, #1a6bb8 100%)`,
            "&:after": {
              content: '""',
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(248,207,20,0.18), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.12), transparent 45%)",
              pointerEvents: "none",
            },
          }}
          size={{
            xs: 12,
            sm: 12,
            lg: 7,
            xl: 8,
          }}
        >
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              height: "100%",
              display: {
                xs: "none",
                lg: "flex",
              },
              alignItems: "center",
              justifyContent: "center",
              px: 6,
            }}
          >
            <Box sx={{ maxWidth: 560, color: "white", textAlign: "left" }}>
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.96)",
                  display: "inline-flex",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
                  animation: "utcRise 0.8s ease-out",
                  "@keyframes utcRise": {
                    from: { opacity: 0, transform: "translateY(12px)" },
                    to: { opacity: 1, transform: "translateY(0)" },
                  },
                }}
              >
                <Image
                  src={UTC_BRAND.logos.full}
                  alt={UTC_BRAND.nameVi}
                  width={280}
                  height={48}
                  style={{ objectFit: "contain", width: "auto", height: 48 }}
                  priority
                />
              </Box>

              <Typography
                variant="h3"
                fontWeight={700}
                sx={{
                  mb: 1.5,
                  color: "white",
                  animation: "utcRise 0.9s ease-out",
                }}
              >
                {UTC_BRAND.product}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mb: 3,
                  color: "rgba(255,255,255,0.88)",
                  lineHeight: 1.8,
                  maxWidth: 480,
                }}
              >
                Hỗ trợ sinh viên {UTC_BRAND.short} với quy chế, thủ tục, học phí/
                học bổng chung và tuyển sinh — kèm trích dẫn nguồn chính thức.
              </Typography>

              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                {[
                  "FAQ-first",
                  "RAG + citation",
                  "Hàng chờ cán bộ",
                ].map((label, i) => (
                  <Box
                    key={label}
                    sx={{
                      px: 2,
                      py: 0.75,
                      borderRadius: 1,
                      bgcolor:
                        i === 1
                          ? c.accent
                          : "rgba(255,255,255,0.12)",
                      color: i === 1 ? c.ink : "white",
                      border: "1px solid rgba(255,255,255,0.2)",
                      fontWeight: 600,
                      fontSize: 13,
                      animation: `utcRise ${0.95 + i * 0.08}s ease-out`,
                    }}
                  >
                    {label}
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 12,
            lg: 5,
            xl: 4,
          }}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ p: 4, width: "100%", maxWidth: 420 }}>
            <Box
              sx={{
                display: { xs: "flex", lg: "none" },
                justifyContent: "center",
                mb: 3,
              }}
            >
              <Image
                src={UTC_BRAND.logos.full}
                alt={UTC_BRAND.nameVi}
                width={220}
                height={40}
                style={{ objectFit: "contain", width: "auto", height: 40 }}
                priority
              />
            </Box>
            <AuthLogin
              title="Đăng nhập"
              subtext={
                <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 1 }}>
                  Sinh viên · Cán bộ · Quản trị {UTC_BRAND.short}
                </Typography>
              }
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 3, textAlign: "center" }}
            >
              {UTC_BRAND.nameVi}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
