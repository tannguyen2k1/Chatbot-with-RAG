"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import PageContainer from "@/app/components/container/PageContainer";
import { getFetcher, postFetcher } from "@/app/api/globalFetcher";
import { useSnackbar } from "@/app/context/SnackbarContext";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";

export default function TicketsPage() {
  const showSnackbar = useSnackbar();
  const canUpdate = useHasPermission("ticket", "update");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("open");
  const [answerTicket, setAnswerTicket] = useState(null);
  const [answer, setAnswer] = useState("");
  const [createFaq, setCreateFaq] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = statusFilter ? `?status=${statusFilter}&page_size=50` : "?page_size=50";
      const data = await getFetcher(`/api/utc/tickets${qs}`);
      setRows(data.data || []);
    } catch (e) {
      showSnackbar(e.message || "Không tải được hàng chờ", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showSnackbar]);

  useEffect(() => {
    load();
  }, [load]);

  const submitAnswer = async () => {
    if (!answerTicket || !answer.trim()) return;
    try {
      await postFetcher(`/api/utc/tickets/${answerTicket.id}/answer`, {
        staff_answer: answer,
        create_faq: createFaq,
        domain: answerTicket.domain,
      });
      showSnackbar(createFaq ? "Đã trả lời và tạo FAQ" : "Đã trả lời", "success");
      setAnswerTicket(null);
      setAnswer("");
      load();
    } catch (e) {
      showSnackbar(e.message || "Trả lời thất bại", "error");
    }
  };

  return (
    <PageContainer title="Hàng chờ" description="Ticket hỗ trợ sinh viên">
      <Box sx={{ p: { xs: 1, sm: 3 } }}>
        <Stack direction="row" justifyContent="space-between" mb={3}>
          <Typography variant="h5" fontWeight={700}>
            Hàng chờ cán bộ
          </Typography>
          <Stack direction="row" spacing={1}>
            {["open", "answered", "closed", ""].map((s) => (
              <Button
                key={s || "all"}
                size="small"
                variant={statusFilter === s ? "contained" : "outlined"}
                onClick={() => setStatusFilter(s)}
              >
                {s || "Tất cả"}
              </Button>
            ))}
          </Stack>
        </Stack>

        {loading ? (
          <CircularProgress />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Câu hỏi</TableCell>
                <TableCell>Lĩnh vực</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Trả lời</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell sx={{ maxWidth: 360 }}>{r.question}</TableCell>
                  <TableCell>{r.domain || "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={r.status}
                      color={r.status === "open" ? "warning" : "success"}
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>
                    {r.staff_answer || "—"}
                  </TableCell>
                  <TableCell align="right">
                    {canUpdate && r.status === "open" && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          setAnswerTicket(r);
                          setAnswer("");
                          setCreateFaq(true);
                        }}
                      >
                        Trả lời
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary">Không có ticket.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Box>

      <Dialog
        open={!!answerTicket}
        onClose={() => setAnswerTicket(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Trả lời ticket #{answerTicket?.id}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {answerTicket?.question}
          </Typography>
          <TextField
            label="Câu trả lời"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            fullWidth
            multiline
            minRows={4}
          />
          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Switch checked={createFaq} onChange={(e) => setCreateFaq(e.target.checked)} />
            }
            label="Đồng thời tạo FAQ"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnswerTicket(null)}>Hủy</Button>
          <Button variant="contained" onClick={submitAnswer}>
            Gửi
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
