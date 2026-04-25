"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import { Grid } from "@mui/material";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PageContainer from "@/app/components/container/PageContainer";
import Logo from "@/app/(DashboardLayout)/layout/shared/logo/Logo";
import AuthLogin from "../../authForms/AuthLogin";

export default function Login() {
  return (
    <PageContainer title="Sign In" description="AI Assistant">
      <Grid
        container
        spacing={0}
        sx={{
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <Grid
          sx={{
            position: "relative",
            "&:before": {
              content: '""',
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f77062 100%)",
              backgroundSize: "400% 400%",
              animation: "gradient 15s ease infinite",
              position: "absolute",
              height: "100%",
              width: "100%",
              opacity: "0.15",
            },
          }}
          size={{
            xs: 12,
            sm: 12,
            lg: 7,
            xl: 8,
          }}
        >
          <Box sx={{ position: "relative" }}>
            <Box sx={{ px: 3, pt: 3 }}>
              <Logo />
            </Box>
            <Box
              sx={{
                alignItems: "center",
                justifyContent: "center",
                height: "calc(100vh - 75px)",
                display: {
                  xs: "none",
                  lg: "flex",
                },
              }}
            >
              <Box
                sx={{
                  textAlign: "center",
                  maxWidth: 500,
                  px: 4,
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "20px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 3,
                    boxShadow: "0 8px 32px rgba(102, 126, 234, 0.4)",
                  }}
                >
                  <Typography sx={{ fontSize: 36, color: "white", fontWeight: 700 }}>
                    VI
                  </Typography>
                </Box>
                <Typography
                  variant="h3"
                  fontWeight={700}
                  sx={{ mb: 1, color: "text.primary" }}
                >
                  AI Assistant
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 3, lineHeight: 1.8 }}
                >
                  Trợ lý AI thông minh. Tìm kiếm thông tin trong tài liệu,
                  trả lời câu hỏi và hỗ trợ công việc hàng ngày.
                </Typography>
                <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" useFlexGap>
                  {[
                    { label: "Tìm kiếm thông minh", color: "#667eea" },
                    { label: "RAG tài liệu", color: "#764ba2" },
                    { label: "Streaming real-time", color: "#f77062" },
                  ].map((tag) => (
                    <Box
                      key={tag.label}
                      sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: "20px",
                        bgcolor: `${tag.color}20`,
                        border: `1px solid ${tag.color}40`,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: tag.color, fontWeight: 600 }}
                      >
                        {tag.label}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
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
          }}
        >
          <Box sx={{ p: 4, width: "100%", maxWidth: 420 }}>
            <AuthLogin
              title="Đăng nhập"
              subtext={
                <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 1 }}>
                  Chào mừng bạn quay trở lại
                </Typography>
              }
              subtitle={
                <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                  <Typography color="textSecondary" variant="body2">
                    Cần hỗ trợ?
                  </Typography>
                  <Typography
                    component={Link}
                    href="/auth/auth1/forgot-password"
                    sx={{
                      fontWeight: 500,
                      textDecoration: "none",
                      color: "primary.main",
                      fontSize: 14,
                    }}
                  >
                    Liên hệ admin
                  </Typography>
                </Stack>
              }
            />
          </Box>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
