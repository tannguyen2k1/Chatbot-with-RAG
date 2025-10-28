"use client";
import React, { useEffect, useState } from "react";
import UserFormDialog from "./UserFormDialog";
import { getFetcher, deleteFetcher, postFetcher } from "@/app/api/globalFetcher";
import {
  Typography,
  Menu,
  MenuItem,
  Box,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  TextField,
  Pagination,
  Select,
  MenuItem as MMenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import UserThemeTable from "@/app/components/tables/UserThemeTable";
import { IconEdit, IconTrash, IconKey } from "@tabler/icons-react";

const fetchUsers = async (page, pageSize, search) => {
  // getFetcher sẽ tự động lấy token từ localStorage
  const url = `/api/users?page=${page + 1}&page_size=${pageSize}&search=${
    search || ""
  }`;
  const data = await getFetcher(url);
  if (!data)
    throw new Error("Lỗi khi tải danh sách người dùng hoặc chưa đăng nhập");
  return data;
};
const deleteUser = async (id) => {
  // deleteFetcher sẽ tự động lấy token từ localStorage
  const url = `/api/users/${id}`;
  const data = await deleteFetcher(url);
  if (!data) throw new Error("Xoá người dùng thất bại hoặc chưa đăng nhập");
  return data;
};

export default function UserTableTemplate({
  reload,
  onActionDone,
  canUpdate = false,
  canDelete = false,
  canResetPassword = false,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [rowCount, setRowCount] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetPasswordId, setResetPasswordId] = useState(null);
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  // Dialog state
  const [formDialog, setFormDialog] = useState({ open: false, user: null });

  const openMenu = Boolean(anchorEl);
  const handleMenuClick = (event, row) => {
    setAnchorEl(event.currentTarget);
    setMenuRow(row);
  };
  // Mở dialog sửa
  const handleEdit = (user) => {
    setFormDialog({ open: true, user });
  };
  // Đóng dialog và nhận notify từ form
  const handleFormClose = (success, message, severity = "success") => {
    setFormDialog({ open: false, user: null });
    if (message)
      setSnackbar({
        open: true,
        message,
        severity: severity || (success ? "success" : "error"),
      });
    if (success) loadData();
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRow(null);
  };

  const loadData = async () => {
    try {
      const data = await fetchUsers(page, pageSize, search);
      setRows(data.data || []);
      setRowCount(data.total || 0);
    } catch (e) {
      setRows([]);
      setRowCount(0);
      setSnackbar({ open: true, message: e.message, severity: "error" });
      if (onActionDone) onActionDone(false, e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // 500ms debounce
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    loadData();
  }, [page, pageSize, debouncedSearch, reload]);

  const handleDelete = async () => {
    try {
      await deleteUser(deleteId);
      setSnackbar({
        open: true,
        message: "Xoá người dùng thành công",
        severity: "success",
      });
      setDeleteId(null);
      setConfirmOpen(false);
      loadData();
    } catch (e) {
      setSnackbar({ open: true, message: e.message, severity: "error" });
      if (onActionDone) onActionDone(false, e.message, "error");
    }
  };

  const handleResetPassword = async () => {
    try {
      await postFetcher(`/api/users/${resetPasswordId}/reset-password`, {
        new_password: "user123456"
      });
      setSnackbar({
        open: true,
        message: "Reset mật khẩu thành công (mật khẩu mới: user123456)",
        severity: "success",
      });
      setResetPasswordId(null);
      setResetPasswordOpen(false);
    } catch (e) {
      setSnackbar({ open: true, message: e.message, severity: "error" });
      if (onActionDone) onActionDone(false, e.message, "error");
    }
  };

  return (
    <Box
      sx={{ borderRadius: 2, boxShadow: 1, p: 2, bgcolor: "background.paper" }}
    >
      <Stack
        direction="row"
        spacing={1}
        mb={2}
        alignItems="center"
        justifyContent={"space-between"}
      >
        <Typography variant="h6" fontWeight={600}>
          Danh sách người dùng
        </Typography>
        <Box width={500}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>
      </Stack>
      <UserThemeTable
        rows={rows}
        loading={loading}
        onMenuClick={handleMenuClick}
      />
      {/* Pagination (MUI) */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="user-page-size-label">Số dòng</InputLabel>
          <Select
            labelId="user-page-size-label"
            label="Số dòng"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
          >
            {[10, 20, 50, 100].map((s) => (
              <MMenuItem key={s} value={s}>{s}</MMenuItem>
            ))}
          </Select>
        </FormControl>
        <Pagination
          page={page + 1}
          count={Math.max(1, Math.ceil(rowCount / pageSize))}
          color="primary"
          onChange={(_, p) => setPage(p - 1)}
          showFirstButton
          showLastButton
        />
      </Stack>
      {/* Menu for actions */}
      <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            handleEdit(menuRow);
          }}
          disabled={!canUpdate || menuRow?.roles?.includes("root")}
        >
          <IconEdit width={18} style={{ marginRight: 8 }} />
          Sửa
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            setResetPasswordId(menuRow.id);
            setResetPasswordOpen(true);
          }}
          disabled={!canResetPassword || menuRow?.roles?.includes("root")}
        >
          <IconKey width={18} style={{ marginRight: 8 }} color="orange" />
          Reset mật khẩu
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            setDeleteId(menuRow.id);
            setConfirmOpen(true);
          }}
          disabled={!canDelete || menuRow?.roles?.includes("root")}
        >
          <IconTrash width={18} style={{ marginRight: 8 }} color="red" />
          Xoá
        </MenuItem>
      </Menu>
      {/* Confirm delete dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Xác nhận xoá</DialogTitle>
        <DialogContent>Bạn có chắc chắn muốn xoá người dùng này?</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Huỷ</Button>
          <Button color="error" onClick={handleDelete}>
            Xoá
          </Button>
        </DialogActions>
      </Dialog>
      {/* Reset password dialog */}
      <Dialog open={resetPasswordOpen} onClose={() => setResetPasswordOpen(false)}>
        <DialogTitle>Reset mật khẩu</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn reset mật khẩu cho user này?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Mật khẩu mới sẽ là: <strong>user123456</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordOpen(false)}>Huỷ</Button>
          <Button color="primary" onClick={handleResetPassword}>
            Reset
          </Button>
        </DialogActions>
      </Dialog>
      {/* Form dialog (edit/create) */}
      {formDialog.open && (
        <UserFormDialog
          open={formDialog.open}
          onClose={handleFormClose}
          user={formDialog.user}
        />
      )}
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
  );
}
