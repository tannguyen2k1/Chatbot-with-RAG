"use client";

import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import {
  IconMessageCircle,
  IconUsers,
  IconFileCheck,
} from "@tabler/icons-react";
import PageContainer from "@/app/components/container/PageContainer";
import { useAuth } from "@/app/context/AuthContext";

const links = [
  {
    title: "AI Chat",
    description: "Trò chuyện với trợ lý RAG trên tài liệu của bạn.",
    href: "/",
    icon: IconMessageCircle,
  },
  {
    title: "Người dùng",
    description: "Quản lý tài khoản và phân quyền người dùng.",
    href: "/systems/user-management",
    icon: IconUsers,
  },
  {
    title: "Audit log",
    description: "Theo dõi thao tác CRUD trên hệ thống.",
    href: "/systems/audit-log",
    icon: IconFileCheck,
  },
];

export default function HomeDashboard() {
  const { user } = useAuth();

  return (
    <PageContainer title="Home" description="Trang chủ Chat Assistant">
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Xin chào{user?.full_name || user?.username ? `, ${user.full_name || user.username}` : ""}
          </Typography>
          <Typography color="text.secondary">
            Chat Assistant — nền tảng trợ lý AI thông minh. Chọn khu vực bên dưới để tiếp tục.
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Grid key={item.href} size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Icon size={28} />
                      <Typography variant="h6">{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                      <Button
                        component={Link}
                        href={item.href}
                        variant="contained"
                        size="small"
                        sx={{ alignSelf: "flex-start" }}
                      >
                        Mở
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Stack>
    </PageContainer>
  );
}
