"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  IconButton,
  Switch,
  Stack,
} from "@mui/material";
import { getFetcher, putFetcher, postFetcher } from "@/app/api/globalFetcher";

export default function PermissionManagementPage() {
  // Không cần BASE_ACTIONS/CUSTOM_ACTIONS nữa, chỉ render toàn bộ quyền

  const searchParams = useSearchParams();
  const roleId = searchParams.get("roleId");
  const [role, setRole] = useState(null);
  // Không cần modules nữa
  const [permissions, setPermissions] = useState([]);
  const [editPerms, setEditPerms] = useState([]); // local state for batch edit
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (!roleId) return;
    setLoading(true);
    Promise.all([
      getFetcher(`/api/rbac/roles/${roleId}`),
      getFetcher("/api/rbac/permissions"),
    ])
      .then(([role, permissions]) => {
        setRole(role);
        setPermissions(
          [...permissions].sort((a, b) => {
            const [modA, actA] = a.name.split(".");
            const [modB, actB] = b.name.split(".");

            const modCompare = modA.localeCompare(modB);
            if (modCompare !== 0) return modCompare;

            return actA.localeCompare(actB);
          })
        );
        setEditPerms(role?.permissions ? [...role.permissions] : []);
      })
      .catch((e) => {
        setSnackbar({ open: true, message: e.message, severity: "error" });
      })
      .finally(() => setLoading(false));
  }, [roleId]);

  // Toggle permission and auto-save (theo API backend)
  // Toggle quyền cho role (không cần module_id)
  const handleToggle = async (permissionId) => {
    if (loading) return;
    setLoading(true);
    // Lấy module_id từ permissions theo permissionId
    const module_id =
      permissions.find((p) => p.id === permissionId)?.module_id || 0;
    const hasPerm = editPerms.some(
      (p) => (p.permission_id || p.id) === permissionId
    );
    let newPerms;
    try {
      if (hasPerm) {
        // Remove permission
        await postFetcher("/api/rbac/remove-permission", {
          role_id: Number(roleId),
          module_id: module_id,
          permission_id: permissionId,
        });
        newPerms = editPerms.filter(
          (p) => (p.permission_id || p.id) !== permissionId
        );
        setSnackbar({
          open: true,
          message: "Đã gỡ quyền thành công!",
          severity: "success",
        });
      } else {
        // Assign permission
        await postFetcher("/api/rbac/assign-permission", {
          role_id: Number(roleId),
          module_id: module_id,
          permission_id: permissionId,
        });
        newPerms = [...editPerms, { permission_id: permissionId, module_id }];
        setSnackbar({
          open: true,
          message: "Đã cấp quyền thành công!",
          severity: "success",
        });
      }
      setEditPerms(newPerms);
    } catch (e) {
      setSnackbar({
        open: true,
        message: e?.response?.data?.detail || e.message,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Typography variant="h4" fontWeight={700} color="primary.main" mb={3}>
        Quản lý quyền cho vai trò
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : roleId && role ? (
        <>
          <Typography mb={2}>
            Vai trò: <b>{role.name}</b>
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: 60 }} align="center">
                    STT
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 220 }}>
                    Tên quyền
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Mô tả</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Đang có?
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {permissions.map((perm, idx) => {
                  const checked = editPerms.some(
                    (rp) => (rp.permission_id || rp.id) === perm.id
                  );
                  return (
                    <TableRow key={perm.id}>
                      <TableCell align="center">{idx + 1}</TableCell>
                      <TableCell>{perm.name}</TableCell>
                      <TableCell>{perm.description || ""}</TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={checked}
                          onChange={() => handleToggle(perm.id)}
                          color={checked ? "success" : "default"}
                          disabled={loading}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <Alert severity="error">
          Không tìm thấy vai trò hoặc thiếu roleId trên URL.
        </Alert>
      )}
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
