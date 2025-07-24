"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, MenuItem, FormControlLabel, Switch, CircularProgress
} from "@mui/material";
import { getFetcher, postFetcher, putFetcher } from "@/app/api/globalFetcher";

const fetchRoles = async () => {
  try {
    const data = await getFetcher('/api/rbac/roles');
    // data là mảng object, lấy ra mảng tên role
    return Array.isArray(data) ? data.map(r => r.name) : [];
  } catch {
    return [];
  }
};

import { useHasPermission } from "@/app/utils/auth/useHasPermission";

export default function UserFormDialog({ open, onClose, user }) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '', phone: '', role: '', is_active: true });
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  useEffect(() => {
    if (open) {
      fetchRoles().then(r => {
        setRoles(r);
        // Lấy role hợp lệ đầu tiên nếu user.role không nằm trong danh sách
        let roleInit = user?.role || user?.roles?.[0] || '';
        if (roleInit && !r.includes(roleInit)) roleInit = '';
        setForm({
          username: user?.username || '',
          email: user?.email || '',
          password: '',
          full_name: user?.full_name || '',
          phone: user?.phone || '',
          role: roleInit,
          is_active: user?.is_active !== undefined ? user.is_active : true
        });
      });
    }
  }, [open, user]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await putFetcher(`/api/users/${user.id}`, form);
      } else {
        res = await postFetcher('/api/users', form);
      }
      if (!res) throw new Error('Lưu người dùng thất bại');
      setSnackbar({ open: true, message: isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công', severity: 'success' });
      onClose(true, isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công');
    } catch (e) {
      setSnackbar({ open: true, message: e.message, severity: 'error' });
      onClose(false, e.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  const canCreate = useHasPermission('user', 'create');
  const canUpdate = useHasPermission('user', 'update');
  const isEditMode = isEdit;
  // Chỉ cho submit nếu có quyền tương ứng
  const canSubmit = isEditMode ? canUpdate : canCreate;
  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? 'Sửa người dùng' : 'Thêm người dùng'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Username" name="username" value={form.username} onChange={handleChange} required fullWidth disabled={isEdit} />
            <TextField label="Email" name="email" value={form.email} onChange={handleChange} required fullWidth type="email" />
            {!isEdit && (
              <TextField label="Mật khẩu" name="password" value={form.password} onChange={handleChange} required fullWidth type="password" />
            )}
            <TextField label="Họ tên" name="full_name" value={form.full_name} onChange={handleChange} fullWidth />
            <TextField label="Số điện thoại" name="phone" value={form.phone} onChange={handleChange} fullWidth />
            <TextField select label="Vai trò" name="role" value={form.role} onChange={handleChange} required fullWidth>
              {roles.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>
            <FormControlLabel control={<Switch checked={form.is_active} name="is_active" onChange={handleChange} />} label="Hoạt động" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose(false)}>Huỷ</Button>
          <Button type="submit" variant="contained" disabled={loading || !canSubmit}>{loading ? <CircularProgress size={20} /> : 'Lưu'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
