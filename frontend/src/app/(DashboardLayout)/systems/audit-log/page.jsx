"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  TextField,
  Stack,
  Button,
  Pagination,
  Select,
  MenuItem as MMenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { getFetcher } from "@/app/api/globalFetcher";

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    getFetcher(
      `/api/audit-logs?page=${page}&page_size=${pageSize}&search=${encodeURIComponent(
        debouncedSearch
      )}`
    )
      .then((res) => {
        setLogs(res.data || []);
        setTotal(res.total || 0);
      })
      .catch((e) => {
        setSnackbar({
          open: true,
          message: e?.response?.data?.detail || e.message,
          severity: "error",
        });
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, debouncedSearch]);

  return (
    <Box
      sx={{
        p: { xs: 1, sm: 3 },
        borderRadius: 2,
        boxShadow: 1,
        bgcolor: "background.paper",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        mb={2}
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="h6" fontWeight={600}>
          Nhật ký hệ thống
        </Typography>
        <Box width={400}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
          />
        </Box>
      </Stack>
      {loading ? (
        <CircularProgress />
      ) : logs.length > 0 ? (
        <TableContainer
          component={Paper}
          sx={{ mt: 2, borderRadius: 3, boxShadow: 2 }}
        >
          <Table sx={{ minWidth: 900 }} size="medium">
            <TableHead>
              <TableRow>
                <TableCell>Thời gian</TableCell>
                <TableCell>Người thực hiện</TableCell>
                <TableCell>Hành động</TableCell>
                <TableCell>Bảng</TableCell>
                <TableCell>ID bản ghi</TableCell>
                <TableCell>Giá trị cũ</TableCell>
                <TableCell>Giá trị mới</TableCell>
                <TableCell>Mô tả</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>{log.user?.username ?? "-"}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.table_name}</TableCell>
                  <TableCell>{log.record_id ?? "-"}</TableCell>
                  <TableCell>{log.old_value ?? ""}</TableCell>
                  <TableCell>{log.new_value ?? ""}</TableCell>
                  <TableCell>{log.description ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info">Không có dữ liệu audit log.</Alert>
      )}
      {/* Pagination (MUI) */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="audit-page-size-label">Số dòng</InputLabel>
          <Select
            labelId="audit-page-size-label"
            label="Số dòng"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          >
            {[10, 20, 50, 100].map((s) => (
              <MMenuItem key={s} value={s}>{s}</MMenuItem>
            ))}
          </Select>
        </FormControl>
        <Pagination
          page={page}
          count={Math.max(1, Math.ceil(total / pageSize))}
          color="primary"
          onChange={(_, p) => setPage(p)}
          showFirstButton
          showLastButton
        />
      </Stack>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
