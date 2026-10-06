"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  FormControlLabel,
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
import {
  getFetcher,
  postFetcher,
  putFetcher,
  deleteFetcher,
} from "@/app/api/globalFetcher";
import { useSnackbar } from "@/app/context/SnackbarContext";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";

export default function FaqsPage() {
  const showSnackbar = useSnackbar();
  const canCreate = useHasPermission("faq", "create");
  const canUpdate = useHasPermission("faq", "update");
  const canDelete = useHasPermission("faq", "delete");

  const [rows, setRows] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({
    question: "",
    answer: "",
    domain: "chung",
    is_active: 1,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFetcher("/api/utc/faqs?page_size=100");
      setRows(data.data || []);
    } catch (e) {
      showSnackbar(e.message || "Không tải được FAQ", "error");
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    getFetcher("/api/utc/domains")
      .then((d) => setDomains(d.filter((x) => x.value !== "out_of_scope")))
      .catch(() => {});
    load();
  }, [load]);

  const openCreate = () => {
    setEdit(null);
    setForm({ question: "", answer: "", domain: "chung", is_active: 1 });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEdit(row);
    setForm({
      question: row.question,
      answer: row.answer,
      domain: row.domain,
      is_active: row.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    try {
      if (edit) {
        await putFetcher(`/api/utc/faqs/${edit.id}`, form);
        showSnackbar("Đã cập nhật FAQ", "success");
      } else {
        await postFetcher("/api/utc/faqs", form);
        showSnackbar("Đã tạo FAQ", "success");
      }
      setOpen(false);
      load();
    } catch (e) {
      showSnackbar(e.message || "Lưu thất bại", "error");
    }
  };

  const remove = async (id) => {
    if (!confirm("Xóa FAQ này?")) return;
    try {
      await deleteFetcher(`/api/utc/faqs/${id}`);
      showSnackbar("Đã xóa", "success");
      load();
    } catch (e) {
      showSnackbar(e.message || "Xóa thất bại", "error");
    }
  };

  return (
    <PageContainer title="FAQ" description="Câu hỏi thường gặp UTC">
      <Box sx={{ p: { xs: 1, sm: 3 } }}>
        <Stack direction="row" justifyContent="space-between" mb={3}>
          <Typography variant="h5" fontWeight={700}>
            FAQ UTC
          </Typography>
          {canCreate && (
            <Button variant="contained" onClick={openCreate}>
              Thêm FAQ
            </Button>
          )}
        </Stack>

        {loading ? (
          <CircularProgress />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Câu hỏi</TableCell>
                <TableCell>Lĩnh vực</TableCell>
                <TableCell>Active</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Typography fontWeight={600}>{r.question}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {r.answer?.slice(0, 120)}
                    </Typography>
                  </TableCell>
                  <TableCell>{r.domain}</TableCell>
                  <TableCell>{r.is_active ? "Có" : "Không"}</TableCell>
                  <TableCell align="right">
                    {canUpdate && (
                      <Button size="small" onClick={() => openEdit(r)}>
                        Sửa
                      </Button>
                    )}
                    {canDelete && (
                      <Button size="small" color="error" onClick={() => remove(r.id)}>
                        Xóa
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="text.secondary">Chưa có FAQ.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{edit ? "Sửa FAQ" : "Thêm FAQ"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Câu hỏi"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              fullWidth
              multiline
            />
            <TextField
              label="Câu trả lời"
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              fullWidth
              multiline
              minRows={4}
            />
            <FormControl fullWidth>
              <InputLabel>Lĩnh vực</InputLabel>
              <Select
                label="Lĩnh vực"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
              >
                {(domains.length
                  ? domains
                  : [{ value: "chung", label: "Chung" }]
                ).map((d) => (
                  <MenuItem key={d.value} value={d.value}>
                    {d.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={!!form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked ? 1 : 0 })
                  }
                />
              }
              label="Đang hoạt động"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={save}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
