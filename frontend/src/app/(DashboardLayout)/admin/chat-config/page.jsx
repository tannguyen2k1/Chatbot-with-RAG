"use client";

import { Stack, Typography, Box } from "@mui/material";
import PageContainer from "@/app/components/container/PageContainer";
import ChatConfigPanel from "@/app/components/admin/ChatConfigPanel";

export default function AdminChatConfigPage() {
  return (
    <PageContainer
      title="Cấu hình chat"
      description="Collection, RAG và system prompt"
    >
      <Box sx={{ pb: 3 }}>
        <Stack spacing={0.5} mb={3}>
          <Typography variant="h4" fontWeight={700} color="primary.main">
            Cấu hình chat
          </Typography>
          <Typography color="text.secondary" maxWidth={640}>
            Collection vector, tham số RAG và system prompt — áp dụng toàn hệ thống. Thay đổi được lưu tự động.
          </Typography>
        </Stack>
        <ChatConfigPanel />
      </Box>
    </PageContainer>
  );
}
