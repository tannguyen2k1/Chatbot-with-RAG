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
} from "@mui/material";
import { IconEdit, IconSettings, IconTrash } from "@tabler/icons-react";
import AddIcon from "@mui/icons-material/Add";
import RoleThemeTable from "@/app/components/tables/RoleThemeTable";
import RoleFormDialog from "./RoleFormDialog";
import { getFetcher, deleteFetcher } from "@/app/api/globalFetcher";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";
import { useRouter } from "next/navigation";

const fetchRoles = async () => {
  return await getFetcher("/api/rbac/roles");
};
const deleteRole = async (id) => {
  return await deleteFetcher("/api/rbac/roles", { id });
};

export default function RoleManagementPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [reload, setReload] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

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
    setEditRole(null);
    setOpenForm(true);
  };
  const handleEdit = (role) => {
    setEditRole(role);
    setOpenForm(true);
  };
  const handleDeleteClick = (role) => {
    setDeleteId(role.id);
    setConfirmOpen(true);
    handleMenuClose();
  };
  const handleCloseForm = (refresh, msg, severity = "success") => {
    setOpenForm(false);
    setEditRole(null);
    if (refresh) setReload((r) => !r);
    if (msg) setSnackbar({ open: true, message: msg, severity });
  };
  const handleDelete = async () => {
    try {
      await deleteRole(deleteId);
      setSnackbar({
        open: true,
        message: "Xoá vai trò thành công",
        severity: "success",
      });
      setReload((r) => !r);
    } catch (e) {
      setSnackbar({ open: true, message: e.message, severity: "error" });
    }
    setConfirmOpen(false);
    setDeleteId(null);
  };

  useEffect(() => {
    setLoading(true);
    fetchRoles()
      .then((data) => {
        setRows(data || []);
      })
      .catch((e) => {
        setRows([]);
        setSnackbar({ open: true, message: e.message, severity: "error" });
      })
      .finally(() => setLoading(false));
  }, [reload]);

  // Quyền
  const canCreate = useHasPermission("role", "create");
  const canUpdate = useHasPermission("role", "update");
  const canDelete = useHasPermission("role", "delete");

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Typography variant="h4" fontWeight={700} color="primary.main">
          Quản lý vai trò
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={!canCreate}
        >
          Thêm vai trò
        </Button>
      </Stack>
      <RoleThemeTable
        rows={rows}
        loading={loading}
        onMenuClick={handleMenuClick}
      />
      {/* Menu actions giống user-management */}
      <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            router.push(`/apps/permission-management?roleId=${menuRow.id}`);
          }}
          disabled={!canUpdate || menuRow?.name === "root"}
        >
          <IconSettings width={18} style={{ marginRight: 8 }} />
          Quản lý quyền
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            handleEdit(menuRow);
          }}
          disabled={!canUpdate || menuRow?.name === "root"}
        >
          <IconEdit width={18} style={{ marginRight: 8 }} />
          Sửa
        </MenuItem>
        <MenuItem
          onClick={() => handleDeleteClick(menuRow)}
          disabled={!canDelete || menuRow?.name === "root"}
        >
          <IconTrash width={18} style={{ marginRight: 8 }} color="red" />
          Xoá
        </MenuItem>
      </Menu>
      {/* Confirm delete dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Xác nhận xoá</DialogTitle>
        <DialogContent>Bạn có chắc chắn muốn xoá vai trò này?</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Huỷ</Button>
          <Button color="error" onClick={handleDelete} disabled={!canDelete}>
            Xoá
          </Button>
        </DialogActions>
      </Dialog>
      <RoleFormDialog
        open={openForm}
        onClose={handleCloseForm}
        role={editRole}
      />
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
