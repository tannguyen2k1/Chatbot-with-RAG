import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box,
  TextField,
  Stack,
  Toolbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import { useUsers } from "app/contexts/UserContext";
import { useAuthCustom } from "app/contexts/AuthContext";
import { MatxLoading } from "app/components";
import { Link } from "react-router-dom";
import SecurityIcon from "@mui/icons-material/Security";
import TablePagination from "@mui/material/TablePagination";
import { useSnackbar } from "notistack";

export default function UserList() {
  const { user, hasPermission } = useAuthCustom();
  const [search, setSearch] = useState("");
  const {
    users,
    loading,
    addUser,
    updateUser,
    deleteUser,
    updateUserRole,
    updateUserPermissions,
    page,
    setPage,
    pageSize,
    setPageSize,
    total
  } = useUsers();
  // Dialog sửa role
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [roleEditUser, setRoleEditUser] = useState(null);
  const [roleValue, setRoleValue] = useState("");
  const [roleError, setRoleError] = useState("");

  // Dialog sửa permissions
  const [openPermDialog, setOpenPermDialog] = useState(false);
  const [permEditUser, setPermEditUser] = useState(null);
  const [permValue, setPermValue] = useState({});
  const [permError, setPermError] = useState("");

  // Mở dialog sửa role
  const handleEditRole = (user) => {
    setRoleEditUser(user);
    setRoleValue(user.role);
    setRoleError("");
    setOpenRoleDialog(true);
  };

  // Mở dialog sửa permissions
  const handleEditPerm = (user) => {
    setPermEditUser(user);
    setPermValue(user.permissions || {});
    setPermError("");
    setOpenPermDialog(true);
  };

  // Lưu role
  const handleSaveRole = async () => {
    try {
      await updateUserRole(roleEditUser.id, roleValue);
      setOpenRoleDialog(false);
      setRoleEditUser(null);
      enqueueSnackbar("Lưu vai trò thành công!", {
        variant: "success",
        anchorOrigin: { vertical: "top", horizontal: "right" }
      });
    } catch (e) {
      setRoleError("Lưu role thất bại!");
      enqueueSnackbar("Lưu role thất bại!", {
        variant: "error",
        anchorOrigin: { vertical: "top", horizontal: "right" }
      });
    }
  };

  // Lưu permissions
  const handleSavePerm = async () => {
    try {
      await updateUserPermissions(permEditUser.id, permValue);
      setOpenPermDialog(false);
      setPermEditUser(null);
      enqueueSnackbar("Lưu quyền thành công!", {
        variant: "success",
        anchorOrigin: { vertical: "top", horizontal: "right" }
      });
    } catch (e) {
      setPermError("Lưu permissions thất bại!");
      enqueueSnackbar("Lưu permissions thất bại!", {
        variant: "error",
        anchorOrigin: { vertical: "top", horizontal: "right" }
      });
    }
  };
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // "add" | "edit"
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    phone: "",
    is_active: 1,
    role: "user"
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, user: null });
  const [errorMsg, setErrorMsg] = useState("");
  const { enqueueSnackbar } = useSnackbar();

  const filteredUsers = Array.isArray(users)
    ? users.filter(
        (u) =>
          u.username?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  // Mở dialog thêm
  const handleAdd = () => {
    setDialogMode("add");
    setForm({
      username: "",
      email: "",
      password: "",
      full_name: "",
      phone: "",
      is_active: 1,
      role: "user"
    });
    setOpenDialog(true);
    setErrorMsg("");
  };

  // Mở dialog sửa
  const handleEdit = (user) => {
    setDialogMode("edit");
    setSelectedUser(user);
    setForm({
      username: user.username,
      email: user.email,
      full_name: user.full_name || "",
      phone: user.phone || "",
      is_active: user.is_active ? 1 : 0,
      role: user.role || "user"
    });
    setOpenDialog(true);
    setErrorMsg("");
  };

  // Xác nhận xoá
  const handleDelete = (user) => {
    setDeleteConfirm({ open: true, user });
  };

  // Thực hiện xoá
  const confirmDelete = async () => {
    try {
      await deleteUser(deleteConfirm.user.id);
      setDeleteConfirm({ open: false, user: null });
      enqueueSnackbar("Xoá người dùng thành công!", {
        variant: "success",
        anchorOrigin: { vertical: "top", horizontal: "right" }
      });
    } catch (e) {
      setErrorMsg("Xoá thất bại!");
      enqueueSnackbar("Xoá thất bại!", {
        variant: "error",
        anchorOrigin: { vertical: "top", horizontal: "right" }
      });
    }
  };

  // Đóng dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setErrorMsg("");
  };

  // Submit form thêm/sửa
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (dialogMode === "add") {
        if (!form.username || !form.email || !form.password) {
          setErrorMsg("Vui lòng nhập username, email, password");
          enqueueSnackbar("Vui lòng nhập username, email, password", {
            variant: "warning",
            anchorOrigin: { vertical: "top", horizontal: "right" }
          });
          return;
        }
        await addUser(form);
        enqueueSnackbar("Thêm người dùng thành công!", {
          variant: "success",
          anchorOrigin: { vertical: "top", horizontal: "right" }
        });
      } else if (dialogMode === "edit" && selectedUser) {
        await updateUser(selectedUser.id, {
          username: form.username,
          email: form.email,
          full_name: form.full_name,
          phone: form.phone,
          is_active: form.is_active
        });
        enqueueSnackbar("Cập nhật người dùng thành công!", {
          variant: "success",
          anchorOrigin: { vertical: "top", horizontal: "right" }
        });
      }
      setOpenDialog(false);
      setSelectedUser(null);
      setErrorMsg("");
    } catch (e) {
      setErrorMsg("Lưu thất bại!");
      enqueueSnackbar("Lưu thất bại!", {
        variant: "error",
        anchorOrigin: { vertical: "top", horizontal: "right" }
      });
    }
  };

  return (
    <Box p={3}>
      <Paper elevation={3} sx={{ p: 2 }}>
        <Toolbar sx={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <Typography variant="h5" fontWeight={600}>
            Quản lý người dùng
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <SearchIcon color="action" />
            <TextField
              size="small"
              variant="outlined"
              placeholder="Tìm kiếm username hoặc email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 220, background: "#fff" }}
            />
            <Button variant="contained" color="primary" onClick={handleAdd} sx={{ ml: 2 }}>
              Thêm người dùng
            </Button>
          </Stack>
        </Toolbar>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ background: "#f5f5f5" }}>
                <TableCell>ID</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Họ tên</TableCell>
                <TableCell>Điện thoại</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Vai trò</TableCell>
                <TableCell align="right">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <MatxLoading />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ color: "text.secondary" }}>
                    Không tìm thấy người dùng nào.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((rowUser) => {
                  // Logic disable
                  let disableActions = false;
                  if (rowUser.role === "root") {
                    disableActions = true;
                  } else if (user?.role === "admin" && ["admin", "root"].includes(rowUser.role)) {
                    disableActions = true;
                  }

                  return (
                    <TableRow key={rowUser.id} hover>
                      <TableCell>{rowUser.id}</TableCell>
                      <TableCell>{rowUser.username}</TableCell>
                      <TableCell>{rowUser.email}</TableCell>
                      <TableCell>{rowUser.full_name || "-"}</TableCell>
                      <TableCell>{rowUser.phone || "-"}</TableCell>
                      <TableCell>{rowUser.is_active ? "Hoạt động" : "Khoá"}</TableCell>
                      <TableCell>{rowUser.role}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleEdit(rowUser)}
                          disabled={disableActions}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(rowUser)}
                          disabled={disableActions}
                        >
                          <DeleteIcon />
                        </IconButton>
                        {/* Nút chuyển sang màn hình quản lý quyền */}
                        <IconButton
                          component={Link}
                          to={`/users/${rowUser.id}/permissions`}
                          title="Quản lý quyền"
                          disabled={disableActions}
                        >
                          <SecurityIcon />
                        </IconButton>
                      </TableCell>
                      {/* Dialog sửa role */}
                      <Dialog open={openRoleDialog} onClose={() => setOpenRoleDialog(false)}>
                        <DialogTitle>Sửa vai trò</DialogTitle>
                        <DialogContent>
                          <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Vai trò</InputLabel>
                            <Select
                              value={roleValue}
                              label="Vai trò"
                              onChange={(e) => setRoleValue(e.target.value)}
                            >
                              <MenuItem value="user">User</MenuItem>
                              <MenuItem value="admin">Admin</MenuItem>
                              <MenuItem value="root">Root</MenuItem>
                            </Select>
                          </FormControl>
                          {roleError && <Typography color="error">{roleError}</Typography>}
                        </DialogContent>
                        <DialogActions>
                          <Button onClick={() => setOpenRoleDialog(false)}>Huỷ</Button>
                          <Button onClick={handleSaveRole} variant="contained" color="primary">
                            Lưu
                          </Button>
                        </DialogActions>
                      </Dialog>

                      {/* Dialog sửa permissions */}
                      <Dialog open={openPermDialog} onClose={() => setOpenPermDialog(false)}>
                        <DialogTitle>Sửa quyền user</DialogTitle>
                        <DialogContent>
                          <Stack spacing={2} sx={{ mt: 1 }}>
                            {/* Ví dụ: demo phân hệ, có thể mở rộng thêm các phân hệ khác */}
                            <Typography fontWeight={600}>Phân hệ: demo</Typography>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={permValue.demo?.includes("view") || false}
                                  onChange={(e) => {
                                    setPermValue((v) => ({
                                      ...v,
                                      demo: e.target.checked
                                        ? [...(v.demo || []), "view"]
                                        : (v.demo || []).filter((x) => x !== "view")
                                    }));
                                  }}
                                />
                              }
                              label="Xem"
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={permValue.demo?.includes("create") || false}
                                  onChange={(e) => {
                                    setPermValue((v) => ({
                                      ...v,
                                      demo: e.target.checked
                                        ? [...(v.demo || []), "create"]
                                        : (v.demo || []).filter((x) => x !== "create")
                                    }));
                                  }}
                                />
                              }
                              label="Thêm"
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={permValue.demo?.includes("update") || false}
                                  onChange={(e) => {
                                    setPermValue((v) => ({
                                      ...v,
                                      demo: e.target.checked
                                        ? [...(v.demo || []), "update"]
                                        : (v.demo || []).filter((x) => x !== "update")
                                    }));
                                  }}
                                />
                              }
                              label="Sửa"
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={permValue.demo?.includes("delete") || false}
                                  onChange={(e) => {
                                    setPermValue((v) => ({
                                      ...v,
                                      demo: e.target.checked
                                        ? [...(v.demo || []), "delete"]
                                        : (v.demo || []).filter((x) => x !== "delete")
                                    }));
                                  }}
                                />
                              }
                              label="Xoá"
                            />
                            {permError && <Typography color="error">{permError}</Typography>}
                          </Stack>
                        </DialogContent>
                        <DialogActions>
                          <Button onClick={() => setOpenPermDialog(false)}>Huỷ</Button>
                          <Button onClick={handleSavePerm} variant="contained" color="primary">
                            Lưu
                          </Button>
                        </DialogActions>
                      </Dialog>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          onPageChange={(e, newPage) => setPage(newPage + 1)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(1);
          }}
          rowsPerPageOptions={[5, 10, 20, 50, 100]}
          labelRowsPerPage="Số dòng mỗi trang"
        />
      </Paper>

      {/* Dialog thêm/sửa user */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === "add" ? "Thêm người dùng" : "Sửa người dùng"}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                required
              />
              <TextField
                label="Email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                type="email"
              />
              {dialogMode === "add" && (
                <TextField
                  label="Password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  type="password"
                />
              )}
              <TextField
                label="Họ tên"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              />
              <TextField
                label="Điện thoại"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.is_active === 1}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, is_active: e.target.checked ? 1 : 0 }))
                    }
                  />
                }
                label="Hoạt động"
              />
              <FormControl>
                <InputLabel>Vai trò</InputLabel>
                <Select
                  value={form.role}
                  label="Vai trò"
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  disabled={dialogMode === "edit"}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
              {errorMsg && <Typography color="error">{errorMsg}</Typography>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Huỷ</Button>
            <Button type="submit" variant="contained" color="primary">
              {dialogMode === "add" ? "Thêm" : "Lưu"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Xác nhận xoá */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, user: null })}
      >
        <DialogTitle>Xác nhận xoá</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc muốn xoá người dùng này?</Typography>
          {errorMsg && <Typography color="error">{errorMsg}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, user: null })}>Huỷ</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Xoá
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
