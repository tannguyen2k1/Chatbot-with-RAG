"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from "@mui/material";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import AddIcon from "@mui/icons-material/Add";
import {
  getFetcher,
  postFetcher,
  putFetcher,
  deleteFetcher,
} from "@/app/api/globalFetcher";
import DemoThemeTable from "./DemoThemeTable";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";

const fetchDemos = async (page, pageSize, search) => {
  const url = `/api/demos?page=${page + 1}&page_size=${pageSize}&search=${
    search || ""
  }`;
  const data = await getFetcher(url);
  if (!data) throw new Error("Lỗi khi tải danh sách demo hoặc chưa đăng nhập");
  return data;
};
const deleteDemo = async (id) => {
  const url = `/api/demos/${id}`;
  await deleteFetcher(url);
  return true;
};

export default function DemoManagementPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [rowCount, setRowCount] = useState(0);
  const [search, setSearch] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formDialog, setFormDialog] = useState({ open: false, demo: null });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Quyền
  const canCreate = useHasPermission("demo", "create");
  const canUpdate = useHasPermission("demo", "update");
  const canDelete = useHasPermission("demo", "delete");

  const openMenu = Boolean(anchorEl);
  const handleMenuClick = (event, row) => {
    setAnchorEl(event.currentTarget);
    setMenuRow(row);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRow(null);
  };
  const handleAdd = () => {
    setFormDialog({ open: true, demo: null });
  };
  const handleEdit = (demo) => {
    setFormDialog({ open: true, demo });
  };
  const handleFormClose = (success, msg, severity = "success") => {
    setFormDialog({ open: false, demo: null });
    if (msg) setSnackbar({ open: true, message: msg, severity });
    if (success) loadData();
  };
  const handleDeleteClick = (demo) => {
    setDeleteId(demo.id);
    setConfirmOpen(true);
    handleMenuClose();
  };
  const handleDelete = async () => {
    try {
      await deleteDemo(deleteId);
      setSnackbar({
        open: true,
        message: "Xoá demo thành công",
        severity: "success",
      });
      loadData();
    } catch (e) {
      setSnackbar({ open: true, message: e.message, severity: "error" });
    }
    setConfirmOpen(false);
    setDeleteId(null);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchDemos(page, pageSize, search);
      setRows(data.data || []);
      setRowCount(data.total || 0);
    } catch (e) {
      setRows([]);
      setRowCount(0);
      setSnackbar({ open: true, message: e.message, severity: "error" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, [page, pageSize, search]);

  // Form dialog
  const [form, setForm] = useState({ title: "", description: "" });
  const [formLoading, setFormLoading] = useState(false);
  useEffect(() => {
    if (formDialog.open) {
      setForm({
        title: formDialog.demo?.title || "",
        description: formDialog.demo?.description || "",
      });
    }
  }, [formDialog]);
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      let res;
      if (formDialog.demo) {
        res = await putFetcher(`/api/demos/${formDialog.demo.id}`, form);
      } else {
        res = await postFetcher(`/api/demos`, form);
      }
      if (!res) throw new Error("Lưu demo thất bại");
      setSnackbar({
        open: true,
        message: formDialog.demo
          ? "Cập nhật thành công"
          : "Thêm mới thành công",
        severity: "success",
      });
      handleFormClose(true);
    } catch (e) {
      setSnackbar({ open: true, message: e.message, severity: "error" });
      handleFormClose(false);
    } finally {
      setFormLoading(false);
    }
  };
  const isEditMode = !!formDialog.demo;
  const canSubmit = isEditMode ? canUpdate : canCreate;

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Typography variant="h4" fontWeight={700} color="primary.main">
          Quản lý demo
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={!canCreate}
        >
          Thêm demo
        </Button>
      </Stack>
      <Box
        sx={{
          borderRadius: 2,
          boxShadow: 1,
          p: 2,
          bgcolor: "background.paper",
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          mb={2}
          alignItems="center"
          justifyContent={"space-between"}
        >
          <Typography variant="h6" fontWeight={600}>
            Danh sách demo
          </Typography>
          <Box width={400}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Box>
        </Stack>
        <DemoThemeTable
          rows={rows}
          loading={loading}
          onMenuClick={handleMenuClick}
        />
        {/* Pagination */}
        <Stack
          direction="row"
          justifyContent="flex-end"
          alignItems="center"
          spacing={2}
          mt={2}
        >
          <Typography>Trang:</Typography>
          <Button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Trước
          </Button>
          <Typography>{page + 1}</Typography>
          <Button
            disabled={(page + 1) * pageSize >= rowCount}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
          <Typography>Tổng: {rowCount}</Typography>
        </Stack>
        {/* Menu for actions */}
        <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              handleEdit(menuRow);
            }}
            disabled={!canUpdate}
          >
            <IconEdit width={18} style={{ marginRight: 8 }} />
            Sửa
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              handleDeleteClick(menuRow);
            }}
            disabled={!canDelete}
          >
            <IconTrash width={18} style={{ marginRight: 8 }} color="red" />
            Xoá
          </MenuItem>
        </Menu>
        {/* Confirm delete dialog */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <DialogTitle>Xác nhận xoá</DialogTitle>
          <DialogContent>Bạn có chắc chắn muốn xoá demo này?</DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)}>Huỷ</Button>
            <Button color="error" onClick={handleDelete} disabled={!canDelete}>
              Xoá
            </Button>
          </DialogActions>
        </Dialog>
        {/* Form dialog (edit/create) */}
        <Dialog
          open={formDialog.open}
          onClose={() => handleFormClose(false)}
          maxWidth="xs"
          fullWidth
        >
          <form onSubmit={handleFormSubmit}>
            <DialogTitle>{isEditMode ? "Sửa demo" : "Thêm demo"}</DialogTitle>
            <DialogContent>
              <Stack spacing={2} mt={1}>
                <TextField
                  label="Tiêu đề"
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  required
                  fullWidth
                />
                <TextField
                  label="Mô tả"
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  fullWidth
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => handleFormClose(false)}>Huỷ</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={formLoading || !canSubmit}
              >
                {formLoading ? <CircularProgress size={20} /> : "Lưu"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
        {/* Snackbar notify */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}
