"use client";
import React, { useState, useEffect } from "react";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";
import {
  Box,
  Typography,
  Button,
  Stack,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UserTableTemplate from "./UserTableTemplate";
import UserFormDialog from "./UserFormDialog";

export default function UserManagementPage() {
  const [openForm, setOpenForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [reload, setReload] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleAdd = () => {
    setEditUser(null);
    setOpenForm(true);
  };
  const handleEdit = (user) => {
    setEditUser(user);
    setOpenForm(true);
  };
  const handleCloseForm = (refresh, msg, severity = "success") => {
    setOpenForm(false);
    setEditUser(null);
    if (refresh) setReload((r) => !r);
    if (msg) setSnackbar({ open: true, message: msg, severity });
  };
  // Quyền
  const canCreate = useHasPermission("user", "create");
  const canUpdate = useHasPermission("user", "update");
  const canDelete = useHasPermission("user", "delete");
  const canResetPassword = useHasPermission("user", "reset-password");

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Typography variant="h4" fontWeight={700} color="primary.main">
          Quản lý người dùng
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={!canCreate}
        >
          Thêm người dùng
        </Button>
      </Stack>
      <UserTableTemplate
        reload={reload}
        onEdit={handleEdit}
        onActionDone={handleCloseForm}
        canUpdate={canUpdate}
        canDelete={canDelete}
        canResetPassword={canResetPassword}
      />
      <UserFormDialog
        open={openForm}
        onClose={handleCloseForm}
        user={editUser}
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
