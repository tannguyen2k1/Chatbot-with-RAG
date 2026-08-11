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
  IconPackage,
  IconAdjustments,
} from "@tabler/icons-react";
import PageContainer from "@/app/components/container/PageContainer";
import { useAuth } from "@/app/context/AuthContext";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";

const linkDefs = [
  {
    title: "AI Chat",
    description: "Trở về trò chuyện với trợ lý RAG trên tài liệu của bạn.",
    href: "/",
    icon: IconMessageCircle,
    permission: null,
  },
  {
    title: "Cấu hình chat",
    description: "Collection, tham số RAG và system prompt hệ thống.",
    href: "/admin/chat-config",
    icon: IconAdjustments,
    permission: ["config", "view"],
  },
  {
    title: "Người dùng",
    description: "Quản lý tài khoản và phân quyền người dùng.",
    href: "/systems/user-management",
    icon: IconUsers,
    permission: ["user", "view"],
  },
  {
    title: "Vai trò",
    description: "Quản lý vai trò và gán quyền cho từng nhóm.",
    href: "/systems/role-management",
    icon: IconPackage,
    permission: ["role", "view"],
  },
  {
    title: "Nhật ký",
    description: "Theo dõi thao tác CRUD trên hệ thống.",
    href: "/systems/audit-log",
    icon: IconFileCheck,
    permission: ["audit_log", "view"],
  },
];

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const canViewUsers = useHasPermission("user", "view");
  const canViewRoles = useHasPermission("role", "view");
  const canViewAudit = useHasPermission("audit_log", "view");
  const canViewConfig = useHasPermission("config", "view");

  const permissionMap = {
    "user.view": canViewUsers,
    "role.view": canViewRoles,
    "audit_log.view": canViewAudit,
    "config.view": canViewConfig,
  };

  const links = linkDefs.filter((item) => {
    if (!item.permission) return true;
    const [module, action] = item.permission;
    return permissionMap[`${module}.${action}`];
  });

  return (
    <PageContainer title="Quản trị" description="Tổng quan quản trị hệ thống">
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Quản trị
            {user?.full_name || user?.username
              ? ` — ${user.full_name || user.username}`
              : ""}
          </Typography>
          <Typography color="text.secondary">
            Tổng quan các khu vực quản trị. Chọn mục bên dưới để tiếp tục.
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Grid key={item.href} size={{ xs: 12, sm: 6, lg: 4 }}>
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
