"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, CircularProgress
} from "@mui/material";
import { getFetcher, postFetcher, putFetcher } from "@/app/api/globalFetcher";

export default function RoleFormDialog({ open, onClose, role }) {
  const isEdit = Boolean(role);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (open) {
      setForm({
        name: role?.name || '',
        description: role?.description || ''
      });
    }
  }, [open, role]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await putFetcher(`/api/rbac/roles`, { id: role.id, ...form });
      } else {
        res = await postFetcher('/api/rbac/roles', form);
      }
      if (!res) throw new Error('Lưu vai trò thất bại');
      onClose(true, isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công');
    } catch (e) {
      onClose(false, e.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? 'Sửa vai trò' : 'Thêm vai trò'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Tên vai trò" name="name" value={form.name} onChange={handleChange} required fullWidth disabled={isEdit} />
            <TextField label="Mô tả" name="description" value={form.description} onChange={handleChange} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose(false)}>Huỷ</Button>
          <Button type="submit" variant="contained" disabled={loading}>{loading ? <CircularProgress size={20} /> : 'Lưu'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
