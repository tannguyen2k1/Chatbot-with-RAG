"use client";
import React, { useEffect, useState } from "react";
import UserFormDialog from './UserFormDialog';
import { Snackbar, Alert } from '@mui/material';
import { getFetcher, deleteFetcher } from '@/app/api/globalFetcher';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from "@mui/material";
import {
  IconDotsVertical,
  IconEdit,
  IconTrash
} from "@tabler/icons-react";

const fetchUsers = async (page, pageSize, search) => {
  // getFetcher sẽ tự động lấy token từ localStorage
  const url = `/api/users?page=${page + 1}&page_size=${pageSize}&search=${search || ''}`;
  const data = await getFetcher(url);
  if (!data) throw new Error('Lỗi khi tải danh sách người dùng hoặc chưa đăng nhập');
  return data;
};
const deleteUser = async (id) => {
  // deleteFetcher sẽ tự động lấy token từ localStorage
  const url = `/api/users/${id}`;
  const data = await deleteFetcher(url);
  if (!data) throw new Error('Xoá người dùng thất bại hoặc chưa đăng nhập');
  return data;
};

export default function UserTableTemplate({ reload, onEdit, onActionDone }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [rowCount, setRowCount] = useState(0);
  const [search, setSearch] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
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
  const handleFormClose = (success, message, severity = 'success') => {
    setFormDialog({ open: false, user: null });
    if (message) setSnackbar({ open: true, message, severity: severity || (success ? 'success' : 'error') });
    if (success) loadData();
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRow(null);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers(page, pageSize, search);
      setRows(data.data || []);
      setRowCount(data.total || 0);
    } catch (e) {
      setSnackbar({ open: true, message: e.message, severity: 'error' });
      if (onActionDone) onActionDone(false, e.message, "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadData(); }, [page, pageSize, search, reload]);

  const handleDelete = async () => {
    try {
      await deleteUser(deleteId);
      setSnackbar({ open: true, message: "Xoá người dùng thành công", severity: 'success' });
      setDeleteId(null);
      setConfirmOpen(false);
      loadData();
    } catch (e) {
      setSnackbar({ open: true, message: e.message, severity: 'error' });
      if (onActionDone) onActionDone(false, e.message, "error");
    }
  };

  return (
    <Box sx={{ background: '#fff', borderRadius: 2, boxShadow: 1, p: 2 }}>
      <Stack direction="row" spacing={1} mb={2} alignItems="center">
        <Typography variant="h6" fontWeight={600}>Danh sách người dùng</Typography>
        <Box flex={1} />
        <input
          type="text"
          placeholder="Tìm kiếm username/email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc', minWidth: 180 }}
        />
      </Stack>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Họ tên</TableCell>
              <TableCell>SĐT</TableCell>
              <TableCell>Vai trò</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} align="center"><CircularProgress /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center">Không có dữ liệu</TableCell></TableRow>
            ) : rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.username}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.full_name}</TableCell>
                <TableCell>{row.phone}</TableCell>
                <TableCell>{row.roles?.length ? row.roles.map(r => <Chip key={r} label={r} size="small" color={r==='root'?'warning':'secondary'} sx={{mr:0.5}} />) : '-'}</TableCell>
                <TableCell>{row.is_active ? <Chip label="Hoạt động" color="success" size="small" /> : <Chip label="Ngừng" size="small" />}</TableCell>
                <TableCell>
                  <IconButton onClick={e => handleMenuClick(e, row)}>
                    <IconDotsVertical width={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Pagination */}
      <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} mt={2}>
        <Typography>Trang:</Typography>
        <Button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Trước</Button>
        <Typography>{page + 1}</Typography>
        <Button disabled={(page + 1) * pageSize >= rowCount} onClick={() => setPage(p => p + 1)}>Sau</Button>
        <Typography>Tổng: {rowCount}</Typography>
      </Stack>
      {/* Menu for actions */}
      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleMenuClose(); handleEdit(menuRow); }}>
          <IconEdit width={18} style={{ marginRight: 8 }} />Sửa
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); setDeleteId(menuRow.id); setConfirmOpen(true); }}>
          <IconTrash width={18} style={{ marginRight: 8 }} color="red" />Xoá
        </MenuItem>
      </Menu>
      {/* Confirm delete dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Xác nhận xoá</DialogTitle>
        <DialogContent>Bạn có chắc chắn muốn xoá người dùng này?</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Huỷ</Button>
          <Button color="error" onClick={handleDelete}>Xoá</Button>
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
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
