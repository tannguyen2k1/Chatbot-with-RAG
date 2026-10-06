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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
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
import { getFetcher, putFetcher, deleteFetcher } from "@/app/api/globalFetcher";
import { authFetch } from "@/app/api/authFetch";
import { useSnackbar } from "@/app/context/SnackbarContext";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";

const DOMAIN_FALLBACK = [
  { value: "dao_tao", label: "Đào tạo" },
  { value: "cong_tac_sv", label: "Công tác SV" },
  { value: "tai_chinh", label: "Tài chính" },
  { value: "thu_tuc", label: "Thủ tục" },
  { value: "tuyen_sinh", label: "Tuyển sinh" },
  { value: "chung", label: "Chung" },
];

export default function KnowledgePage() {
  const showSnackbar = useSnackbar();
  const canCreate = useHasPermission("document", "create");
  const canUpdate = useHasPermission("document", "update");
  const canDelete = useHasPermission("document", "delete");

  const [rows, setRows] = useState([]);
  const [domains, setDomains] = useState(DOMAIN_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [filterDomain, setFilterDomain] = useState("");
  const [form, setForm] = useState({
    title: "",
    domain: "chung",
    audience: "all",
    source: "",
    effective_from: "",
    effective_to: "",
    collection_name: "default",
    file: null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filterDomain ? `?domain=${filterDomain}` : "";
      const data = await getFetcher(`/api/utc/documents${qs}`);
      setRows(data.data || []);
    } catch (e) {
      showSnackbar(e.message || "Không tải được kho tri thức", "error");
    } finally {
      setLoading(false);
    }
  }, [filterDomain, showSnackbar]);

  useEffect(() => {
    getFetcher("/api/utc/domains")
      .then((d) => setDomains(d.filter((x) => x.value !== "out_of_scope")))
      .catch(() => {});
    load();
  }, [load]);

  const handleUpload = async () => {
    if (!form.file || !form.title) {
      showSnackbar("Cần tiêu đề và file", "warning");
      return;
    }
    const fd = new FormData();
    fd.append("file", form.file);
    fd.append("title", form.title);
    fd.append("domain", form.domain);
    fd.append("audience", form.audience);
    fd.append("collection_name", form.collection_name);
    if (form.source) fd.append("source", form.source);
    if (form.effective_from) fd.append("effective_from", form.effective_from);
    if (form.effective_to) fd.append("effective_to", form.effective_to);

    try {
      const res = await authFetch("/api/utc/documents/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      showSnackbar("Đã tải lên — đang xử lý ingest", "success");
      setUploadOpen(false);
      setForm({
        title: "",
        domain: "chung",
        audience: "all",
        source: "",
        effective_from: "",
        effective_to: "",
        collection_name: "default",
        file: null,
      });
      load();
    } catch (e) {
      showSnackbar(e.message || "Upload thất bại", "error");
    }
  };

  const handleSaveEdit = async () => {
    if (!editDoc) return;
    try {
      await putFetcher(`/api/utc/documents/${editDoc.id}`, {
        title: editDoc.title,
        domain: editDoc.domain,
        audience: editDoc.audience,
        source: editDoc.source,
        effective_from: editDoc.effective_from || null,
        effective_to: editDoc.effective_to || null,
      });
      showSnackbar("Đã cập nhật metadata", "success");
      setEditDoc(null);
      load();
    } catch (e) {
      showSnackbar(e.message || "Cập nhật thất bại", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Xóa tài liệu này?")) return;
    try {
      await deleteFetcher(`/api/utc/documents/${id}`);
      showSnackbar("Đã xóa", "success");
      load();
    } catch (e) {
      showSnackbar(e.message || "Xóa thất bại", "error");
    }
  };

  const statusColor = (s) =>
    ({ ready: "success", processing: "warning", failed: "error", pending: "default" }[s] ||
    "default");

  return (
    <PageContainer title="Kho tri thức" description="Quản lý văn bản UTC">
      <Box sx={{ p: { xs: 1, sm: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight={700}>
            Kho tri thức UTC
          </Typography>
          <Stack direction="row" spacing={1}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Lĩnh vực</InputLabel>
              <Select
                label="Lĩnh vực"
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {domains.map((d) => (
                  <MenuItem key={d.value} value={d.value}>
                    {d.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {canCreate && (
              <Button variant="contained" onClick={() => setUploadOpen(true)}>
                Tải lên
              </Button>
            )}
          </Stack>
        </Stack>

        {loading ? (
          <CircularProgress />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tiêu đề</TableCell>
                <TableCell>Lĩnh vực</TableCell>
                <TableCell>Đối tượng</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Hiệu lực</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Typography fontWeight={600}>{r.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {r.filename}
                    </Typography>
                  </TableCell>
                  <TableCell>{r.domain}</TableCell>
                  <TableCell>{r.audience}</TableCell>
                  <TableCell>
                    <Chip size="small" label={r.status} color={statusColor(r.status)} />
                  </TableCell>
                  <TableCell>
                    {[r.effective_from, r.effective_to].filter(Boolean).join(" → ") || "—"}
                  </TableCell>
                  <TableCell align="right">
                    {canUpdate && (
                      <Button size="small" onClick={() => setEditDoc({ ...r })}>
                        Sửa
                      </Button>
                    )}
                    {canDelete && (
                      <Button size="small" color="error" onClick={() => handleDelete(r.id)}>
                        Xóa
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary">Chưa có tài liệu. Hãy tải lên văn bản UTC.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Box>

      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Tải tài liệu vào kho tri thức</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Tiêu đề"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Lĩnh vực</InputLabel>
              <Select
                label="Lĩnh vực"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
              >
                {domains.map((d) => (
                  <MenuItem key={d.value} value={d.value}>
                    {d.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Đối tượng (audience)"
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
              fullWidth
            />
            <TextField
              label="Nguồn"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Hiệu lực từ"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.effective_from}
                onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
                fullWidth
              />
              <TextField
                label="Hiệu lực đến"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.effective_to}
                onChange={(e) => setForm({ ...form, effective_to: e.target.value })}
                fullWidth
              />
            </Stack>
            <Button variant="outlined" component="label">
              Chọn file
              <input
                type="file"
                hidden
                accept=".pdf,.docx,.doc,.html,.htm,.txt"
                onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
              />
            </Button>
            {form.file && (
              <Typography variant="body2">{form.file.name}</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleUpload}>
            Tải lên
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editDoc} onClose={() => setEditDoc(null)} fullWidth maxWidth="sm">
        <DialogTitle>Sửa metadata</DialogTitle>
        <DialogContent>
          {editDoc && (
            <Stack spacing={2} mt={1}>
              <TextField
                label="Tiêu đề"
                value={editDoc.title}
                onChange={(e) => setEditDoc({ ...editDoc, title: e.target.value })}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Lĩnh vực</InputLabel>
                <Select
                  label="Lĩnh vực"
                  value={editDoc.domain}
                  onChange={(e) => setEditDoc({ ...editDoc, domain: e.target.value })}
                >
                  {domains.map((d) => (
                    <MenuItem key={d.value} value={d.value}>
                      {d.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Đối tượng"
                value={editDoc.audience || "all"}
                onChange={(e) => setEditDoc({ ...editDoc, audience: e.target.value })}
                fullWidth
              />
              <TextField
                label="Nguồn"
                value={editDoc.source || ""}
                onChange={(e) => setEditDoc({ ...editDoc, source: e.target.value })}
                fullWidth
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDoc(null)}>Hủy</Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
