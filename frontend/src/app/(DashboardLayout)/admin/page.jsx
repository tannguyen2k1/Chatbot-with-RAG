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
  IconBooks,
  IconHelp,
  IconTicket,
  IconChartBar,
} from "@tabler/icons-react";
import PageContainer from "@/app/components/container/PageContainer";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";

const linkDefs = [
  {
    title: "Chat sinh viên",
    description: "Trò chuyện hỗ trợ quy chế, thủ tục, học phí chung UTC.",
    href: "/",
    icon: IconMessageCircle,
    permission: null,
  },
  {
    title: "Kho tri thức",
    description: "Upload và quản lý metadata văn bản UTC.",
    href: "/admin/knowledge",
    icon: IconBooks,
    permission: ["document", "view"],
  },
  {
    title: "FAQ",
    description: "Quản lý câu hỏi thường gặp.",
    href: "/admin/faqs",
    icon: IconHelp,
    permission: ["faq", "view"],
  },
  {
    title: "Hàng chờ",
    description: "Ticket từ feedback tiêu cực / chưa trả lời được.",
    href: "/admin/tickets",
    icon: IconTicket,
    permission: ["ticket", "view"],
  },
  {
    title: "Thống kê",
    description: "Tỷ lệ hữu ích, ticket mở, domain thiếu dữ liệu.",
    href: "/admin/stats",
    icon: IconChartBar,
    permission: ["stats", "view"],
  },
  {
    title: "Cấu hình chat",
    description: "Collection, tham số RAG và system prompt UTC.",
    href: "/admin/chat-config",
    icon: IconAdjustments,
    permission: ["config", "view"],
  },
  {
    title: "Người dùng",
    description: "Quản lý tài khoản và phân quyền.",
    href: "/systems/user-management",
    icon: IconUsers,
    permission: ["user", "view"],
  },
  {
    title: "Vai trò",
    description: "student / staff / admin / root.",
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
  const canViewUsers = useHasPermission("user", "view");
  const canViewRoles = useHasPermission("role", "view");
  const canViewAudit = useHasPermission("audit_log", "view");
  const canViewConfig = useHasPermission("config", "view");
  const canViewDoc = useHasPermission("document", "view");
  const canViewFaq = useHasPermission("faq", "view");
  const canViewTicket = useHasPermission("ticket", "view");
  const canViewStats = useHasPermission("stats", "view");

  const permissionMap = {
    "user.view": canViewUsers,
    "role.view": canViewRoles,
    "audit_log.view": canViewAudit,
    "config.view": canViewConfig,
    "document.view": canViewDoc,
    "faq.view": canViewFaq,
    "ticket.view": canViewTicket,
    "stats.view": canViewStats,
  };

  const links = linkDefs.filter((item) => {
    if (!item.permission) return true;
    const [module, action] = item.permission;
    return permissionMap[`${module}.${action}`];
  });

  return (
    <PageContainer title="Quản trị UTC" description="Tổng quan quản trị chatbot">
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" fontWeight={700} mb={1}>
          Quản trị Chatbot UTC
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Kho tri thức, FAQ, hàng chờ cán bộ và cấu hình hệ thống.
        </Typography>
        <Grid container spacing={2}>
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Grid key={item.href} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Icon size={28} />
                      <Typography variant="h6">{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                      <Button component={Link} href={item.href} variant="outlined" size="small">
                        Mở
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </PageContainer>
  );
}
