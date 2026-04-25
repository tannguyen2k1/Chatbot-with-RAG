"use client";
import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  Switch,
  Pagination,
  Select,
  MenuItem as MMenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import AddIcon from '@mui/icons-material/Add';
import { getFetcher, postFetcher, putFetcher, deleteFetcher } from '@/app/api/globalFetcher';
import TenantTable from './TenantTable';
import { useHasPermission } from '@/app/utils/auth/useHasPermission';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useSnackbar } from '@/app/context/SnackbarContext';

const fetchTenants = async (page, pageSize, search) => {
  const url = `/api/tenant?page=${page + 1}&page_size=${pageSize}&search=${search || ''}`;
  const data = await getFetcher(url);
  if (!data) throw new Error('Lỗi khi tải danh sách tenant hoặc chưa đăng nhập');
  return data;
};
const deleteTenant = async (id) => {
  const url = `/api/tenant/${id}`;
  await deleteFetcher(url);
  return true;
};

export default function TenantManagementPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [rowCount, setRowCount] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formDialog, setFormDialog] = useState({ open: false, tenant: null });
  const showSnackbar = useSnackbar();

  // Quyền
  const canCreate = useHasPermission('tenant', 'create');
  const canUpdate = useHasPermission('tenant', 'update');
  const canDelete = useHasPermission('tenant', 'delete');
  const canView = useHasPermission('tenant', 'view');

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
    setFormDialog({ open: true, tenant: null });
  };
  const handleEdit = (tenant) => {
    setFormDialog({ open: true, tenant });
  };
  const handleFormClose = (success, msg, severity = 'success') => {
    setFormDialog({ open: false, tenant: null });
    if (msg) showSnackbar(msg, severity);
    if (success) loadData();
  };
  const handleDeleteClick = (tenant) => {
    setDeleteId(tenant.id);
    setConfirmOpen(true);
    handleMenuClose();
  };
  const handleDelete = async () => {
    try {
      await deleteTenant(deleteId);
      showSnackbar('Xoá tenant thành công', 'success');
      loadData();
    } catch (e) {
      showSnackbar(e.message, 'error');
    }
    setConfirmOpen(false);
    setDeleteId(null);
  };

  const loadData = async () => {
    if (!canView) return; // Không gọi nếu không có quyền
    setLoading(true);
    try {
      const data = await fetchTenants(page, pageSize, debouncedSearch);
      setRows(data.data || []);
      setRowCount(data.total || 0);
    } catch (e) {
      setRows([]);
      setRowCount(0);
      if (e.message) showSnackbar(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    loadData();
  }, [page, pageSize, debouncedSearch, canView]);

  // Form state
  const [form, setForm] = useState({
    name: '',
    tenant_code: '',
    domain: '',
    subdomain: '',
    expiration_date: null,
    is_active: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  useEffect(() => {
    if (formDialog.open) {
      setForm({
        name: formDialog.tenant?.name || '',
        tenant_code: formDialog.tenant?.tenant_code || '',
        domain: formDialog.tenant?.domain || '',
        subdomain: formDialog.tenant?.subdomain || '',
        expiration_date: formDialog.tenant?.expiration_date || null,
        is_active: formDialog.tenant?.is_active ?? true,
      });
    }
  }, [formDialog]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const handleDateChange = (value) => {
    setForm((f) => ({ ...f, expiration_date: value ? value.startOf('day').toISOString() : null }));
  };
  const handleSwitchChange = (e) => {
    const { checked } = e.target;
    setForm((f) => ({ ...f, is_active: checked }));
  };
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      let payload = { ...form };
      if (!payload.expiration_date) delete payload.expiration_date;
      if (formDialog.tenant) {
        // Update
        const res = await putFetcher(`/api/tenant/${formDialog.tenant.id}`, payload);
        if (!res) throw new Error('Cập nhật tenant thất bại');
        setSnackbar({ open: true, message: 'Cập nhật thành công', severity: 'success' });
      } else {
        const res = await postFetcher(`/api/tenant/`, payload);
        if (!res) throw new Error('Tạo tenant thất bại');
        showSnackbar('Thêm mới thành công', 'success');
      }
      handleFormClose(true);
    } catch (e) {
      showSnackbar(e.message, 'error');
      handleFormClose(false);
    } finally {
      setFormLoading(false);
    }
  };

  const isEditMode = !!formDialog.tenant;
  const canSubmit = isEditMode ? canUpdate : canCreate;

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" fontWeight={700} color="primary.main">Quản lý tenant</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} disabled={!canCreate}>Thêm tenant</Button>
      </Stack>
      <Box sx={{ borderRadius: 2, boxShadow: 1, p: 2, bgcolor: 'background.paper' }}>
        <Stack direction="row" spacing={1} mb={2} alignItems="center" justifyContent={'space-between'}>
          <Typography variant="h6" fontWeight={600}>Danh sách tenant</Typography>
          <Box width={400}>
            <TextField fullWidth placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </Box>
        </Stack>
        <TenantTable rows={rows} loading={loading} onMenuClick={handleMenuClick} />
        {/* Pagination (MUI) */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="tenant-page-size-label">Số dòng</InputLabel>
            <Select
              labelId="tenant-page-size-label"
              label="Số dòng"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
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
          <MenuItem onClick={() => { handleMenuClose(); handleEdit(menuRow); }} disabled={!canUpdate}>
            <IconEdit width={18} style={{ marginRight: 8 }} />Sửa
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); handleDeleteClick(menuRow); }} disabled={!canDelete}>
            <IconTrash width={18} style={{ marginRight: 8 }} color="red" />Xoá
          </MenuItem>
        </Menu>
        {/* Confirm delete dialog */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <DialogTitle>Xác nhận xoá</DialogTitle>
          <DialogContent>Bạn có chắc chắn muốn xoá tenant này? Hành động không thể hoàn tác.</DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)}>Huỷ</Button>
            <Button color="error" onClick={handleDelete} disabled={!canDelete}>Xoá</Button>
          </DialogActions>
        </Dialog>
        {/* Form dialog (edit/create) */}
        <Dialog open={formDialog.open} onClose={() => handleFormClose(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleFormSubmit}>
            <DialogTitle>{isEditMode ? 'Sửa tenant' : 'Thêm tenant'}</DialogTitle>
            <DialogContent>
              <Stack spacing={2} mt={1}>
                <TextField label="Mã (tenant_code)" name="tenant_code" value={form.tenant_code} onChange={handleFormChange} required fullWidth disabled={isEditMode} />
                <TextField label="Tên" name="name" value={form.name} onChange={handleFormChange} required fullWidth />
                <TextField label="Domain" name="domain" value={form.domain} onChange={handleFormChange} fullWidth />
                <TextField label="Subdomain" name="subdomain" value={form.subdomain} onChange={handleFormChange} fullWidth />
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Ngày hết hạn"
                    format="DD/MM/YYYY"
                    value={form.expiration_date ? dayjs(form.expiration_date) : null}
                    onChange={handleDateChange}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
                <FormControlLabel control={<Switch checked={form.is_active} onChange={handleSwitchChange} />} label={form.is_active ? 'Active' : 'Inactive'} />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => handleFormClose(false)}>Huỷ</Button>
              <Button type="submit" variant="contained" disabled={formLoading || !canSubmit}>{formLoading ? <CircularProgress size={20} /> : 'Lưu'}</Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </Box>
  );
}
