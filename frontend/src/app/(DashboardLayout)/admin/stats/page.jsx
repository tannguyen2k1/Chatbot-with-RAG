"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  Chip,
  CircularProgress,
} from "@mui/material";
import PageContainer from "@/app/components/container/PageContainer";
import { getFetcher } from "@/app/api/globalFetcher";
import { useSnackbar } from "@/app/context/SnackbarContext";

export default function StatsPage() {
  const showSnackbar = useSnackbar();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFetcher("/api/utc/stats")
      .then(setStats)
      .catch((e) => showSnackbar(e.message || "Không tải được thống kê", "error"))
      .finally(() => setLoading(false));
  }, [showSnackbar]);

  const cards = stats
    ? [
        { label: "Cuộc hội thoại", value: stats.total_conversations },
        { label: "Feedback", value: stats.total_feedback },
        {
          label: "Tỷ lệ hữu ích",
          value: `${Math.round((stats.helpful_rate || 0) * 100)}%`,
        },
        { label: "Ticket mở", value: stats.open_tickets },
        { label: "FAQ", value: stats.faq_count },
        { label: "Tài liệu KB", value: stats.document_count },
      ]
    : [];

  return (
    <PageContainer title="Thống kê" description="Thống kê chatbot UTC">
      <Box sx={{ p: { xs: 1, sm: 3 } }}>
        <Typography variant="h5" fontWeight={700} mb={3}>
          Thống kê chatbot UTC
        </Typography>

        {loading ? (
          <CircularProgress />
        ) : (
          <Stack spacing={3}>
            <Grid container spacing={2}>
              {cards.map((c) => (
                <Grid key={c.label} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        {c.label}
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        {c.value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box>
              <Typography variant="h6" mb={1}>
                Top lĩnh vực
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {(stats?.top_domains || []).map((d) => (
                  <Chip
                    key={d.domain || d.name}
                    label={`${d.domain || d.name}: ${d.count}`}
                  />
                ))}
                {!stats?.top_domains?.length && (
                  <Typography color="text.secondary">Chưa có dữ liệu.</Typography>
                )}
              </Stack>
            </Box>

            <Box>
              <Typography variant="h6" mb={1}>
                Lĩnh vực thiếu dữ liệu
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {(stats?.missing_data_domains || []).map((d) => (
                  <Chip key={d} color="warning" label={d} />
                ))}
                {!stats?.missing_data_domains?.length && (
                  <Typography color="text.secondary">Đủ dữ liệu các lĩnh vực chính.</Typography>
                )}
              </Stack>
            </Box>
          </Stack>
        )}
      </Box>
    </PageContainer>
  );
}
