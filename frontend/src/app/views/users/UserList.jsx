import React, { useState, useEffect } from "react";
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
import { UserProvider } from "app/contexts/UserContext";

function UserListContent() {
  const { user, hasPermission, hasRole } = useAuthCustom();
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
    total,
    search,
    setSearch
  } = useUsers();
  // Xoá các state, biến, dialog, hàm liên quan đến sửa role (openRoleDialog, roleEditUser, roleValue, roleError, handleEditRole, handleSaveRole, v.v.)

 
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
  const filteredUsers = Array.isArray(users) ? users : [];

  // Nếu context không trả về setSearch (cũ), fallback về useState local
  const [localSearch, setLocalSearch] = useState("");
  const searchValue = typeof search === "string" ? search : localSearch;
  const setSearchValue = typeof setSearch === "function" ? setSearch : setLocalSearch;

  // Mở dialog thêm (chỉ admin/root mới được thêm)
  const handleAdd = () => {
    if (!(hasPermission && hasPermission("user", "create"))) {
      enqueueSnackbar("Bạn không có quyền thêm người dùng!", { variant: "warning" });
      return;
    }
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

  // Mở dialog sửa (chỉ admin/root, không sửa user có role cao hơn hoặc bằng mình)
  const handleEdit = (editUser) => {
    if (!(hasPermission && hasPermission("user", "update"))) {
      enqueueSnackbar("Bạn không có quyền sửa người dùng!", { variant: "warning" });
      return;
    }
    // Không cho phép sửa user có role cao hơn hoặc bằng mình
    if (hasRole && editUser.role && ["root"].includes(editUser.role)) {
      enqueueSnackbar("Không thể sửa người dùng có vai trò root!", { variant: "warning" });
      return;
    }
    if (hasRole && hasRole("admin") && ["admin", "root"].includes(editUser.role)) {
      enqueueSnackbar("Admin không thể sửa admin hoặc root!", { variant: "warning" });
      return;
    }
    setDialogMode("edit");
    setSelectedUser(editUser);
    setForm({
      username: editUser.username,
      email: editUser.email,
      full_name: editUser.full_name || "",
      phone: editUser.phone || "",
      is_active: editUser.is_active ? 1 : 0,
      role: editUser.role || "user"
    });
    setOpenDialog(true);
    setErrorMsg("");
  };

  // Xác nhận xoá (chỉ admin/root, không xoá user có role cao hơn hoặc bằng mình)
  const handleDelete = (delUser) => {
    if (!(hasPermission && hasPermission("user", "delete"))) {
      enqueueSnackbar("Bạn không có quyền xoá người dùng!", { variant: "warning" });
      return;
    }
    if (hasRole && delUser.role && ["root"].includes(delUser.role)) {
      enqueueSnackbar("Không thể xoá người dùng có vai trò root!", { variant: "warning" });
      return;
    }
    if (hasRole && hasRole("admin") && ["admin", "root"].includes(delUser.role)) {
      enqueueSnackbar("Admin không thể xoá admin hoặc root!", { variant: "warning" });
      return;
    }
    setDeleteConfirm({ open: true, user: delUser });
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
          is_active: form.is_active,
          role: form.role
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

  // Debounce search để gọi backend, giống DemoList
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (typeof setSearch === "function") {
        setPage(1); // reset page về 1 khi search
        setSearch(searchValue);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchValue, setSearch, setPage]);

  // Trigger backend fetch khi page, pageSize, search thay đổi (nếu context không tự fetch)
  // Nếu context User chưa tự fetch, có thể cần gọi fetchUsers ở đây
  useEffect(() => {
    // Gọi fetchUsers nếu context chưa tự động fetch
  }, [page, pageSize, search]); // Thêm dependency nếu cần thiết

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
              autoComplete="off" 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              sx={{ minWidth: 220, background: "#fff" }}
            />
            {(hasPermission && hasPermission("user", "create")) && (
              <Button variant="contained" color="primary" onClick={handleAdd} sx={{ ml: 2 }}>
                Thêm người dùng
              </Button>
            )}
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
                  // RBAC logic using hasRole
                  let disableActions = false;
                  // Disable if rowUser is root
                  if (rowUser.roles?.includes("root") || (typeof rowUser.role === "string" && rowUser.role === "root")) {
                    disableActions = true;
                  } else if (
                    hasRole("admin") &&
                    (rowUser.roles?.some((r) => ["admin", "root"].includes(r)) || ["admin", "root"].includes(rowUser.role))
                  ) {
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
                      <TableCell>{Array.isArray(rowUser.roles) ? rowUser.roles.join(", ") : rowUser.role}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleEdit(rowUser)}
                          disabled={disableActions || !(hasPermission && hasPermission("user", "update"))}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(rowUser)}
                          disabled={disableActions || !(hasPermission && hasPermission("user", "delete"))}
                        >
                          <DeleteIcon />
                        </IconButton>
                        {/* Nút chuyển sang màn hình quản lý quyền */}
                        {(hasPermission && hasPermission("user", "update")) && (
                          <IconButton
                            component={Link}
                            to={`/users/${rowUser.id}/permissions`}
                            title="Quản lý quyền"
                            disabled={disableActions}
                          >
                            <SecurityIcon />
                          </IconButton>
                        )}
                      </TableCell>
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
                >
                  <MenuItem value="user">User</MenuItem>
                  {/* Chỉ root mới được tạo admin */}
                  {hasRole("root") && <MenuItem value="admin">Admin</MenuItem>}
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

export default function UserListWrapper(props) {
  return (
    <UserProvider>
      <UserListContent {...props} />
    </UserProvider>
  );
}
