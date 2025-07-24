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
} from "@mui/material";
import CheckIcon from "@mui/icons-material/CheckCircle";
import RemoveIcon from "@mui/icons-material/RemoveCircleOutline";
import { getFetcher, putFetcher, postFetcher } from "@/app/api/globalFetcher";

export default function PermissionManagementPage() {
  // Danh sách action chuẩn hóa giống backend
  const BASE_ACTIONS = [
    ["view", "Xem"],
    ["create", "Tạo"],
    ["update", "Sửa"],
    ["delete", "Xoá"],
  ];
  const permDescriptions = {
    create: "Tạo mới",
    view: "Xem",
    update: "Sửa",
    delete: "Xoá",
  };

  const searchParams = useSearchParams();
  const roleId = searchParams.get("roleId");
  const [role, setRole] = useState(null);
  const [modules, setModules] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePerms, setRolePerms] = useState([]);
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
      getFetcher("/api/rbac/roles"),
      getFetcher("/api/rbac/modules"),
      getFetcher("/api/rbac/permissions"),
    ])
      .then(([roles, modules, permissions]) => {
        const roleIdNum = Number(roleId);
        const foundRole = roles.find((r) => r.id === roleIdNum);
        setRole(foundRole);
        setModules(modules);
        setPermissions(permissions);
        setRolePerms(foundRole?.permissions || []);
        setEditPerms(foundRole?.permissions ? [...foundRole.permissions] : []);
      })
      .catch((e) => {
        setSnackbar({ open: true, message: e.message, severity: "error" });
      })
      .finally(() => setLoading(false));
  }, [roleId]);

  // Không cho chọn role nữa, chỉ chỉnh quyền cho roleId truyền vào

  // Toggle permission and auto-save (theo API backend)
  const handleToggle = async (moduleId, permissionId) => {
    if (loading) return;
    setLoading(true);
    const hasPerm = editPerms.some(
      (p) => p.module_id === moduleId && p.permission_id === permissionId
    );
    let newPerms;
    try {
      if (hasPerm) {
        // Remove permission
        await postFetcher("/api/rbac/remove-permission", {
          role_id: Number(roleId),
          module_id: moduleId,
          permission_id: permissionId,
        });
        newPerms = editPerms.filter(
          (p) => !(p.module_id === moduleId && p.permission_id === permissionId)
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
          module_id: moduleId,
          permission_id: permissionId,
        });
        newPerms = [
          ...editPerms,
          { module_id: moduleId, permission_id: permissionId },
        ];
        setSnackbar({
          open: true,
          message: "Đã cấp quyền thành công!",
          severity: "success",
        });
      }
      setEditPerms(newPerms);
      setRolePerms([...newPerms]);
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
      {roleId && role ? (
        <>
          <Typography mb={2}>
            Vai trò: <b>{role.name}</b>
          </Typography>
          {loading ? (
            <CircularProgress />
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 180 }}>
                      Module
                    </TableCell>
                    {BASE_ACTIONS.map((action) => (
                      <TableCell
                        key={action[0]}
                        align="center"
                        sx={{ fontWeight: 700 }}
                      >
                        <Box
                          display="flex"
                          flexDirection="column"
                          alignItems="center"
                        >
                          <span>{action[0]}</span>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: 11 }}
                          >
                            {permDescriptions[action[0]] || ""}
                          </Typography>
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modules.map((mod) => (
                    <TableRow key={mod.id}>
                      <TableCell sx={{ fontWeight: 600 }}>{mod.name}</TableCell>
                      {BASE_ACTIONS.map((action) => {
                        // Tìm permission tương ứng module + action
                        const perm = permissions.find(
                          (p) => p.name === `${mod.name}.${action[0]}`
                        );
                        if (!perm) {
                          return (
                            <TableCell key={action[0]} align="center">
                              -
                            </TableCell>
                          );
                        }
                        const checked = editPerms.some(
                          (rp) =>
                            rp.module_id === mod.id &&
                            rp.permission_id === perm.id
                        );
                        return (
                          <TableCell key={perm.id} align="center">
                            <Tooltip
                              title={
                                checked
                                  ? `Đã có quyền: ${
                                      permDescriptions[action[0]] || perm.name
                                    }`
                                  : `Chưa có quyền: ${
                                      permDescriptions[action[0]] || perm.name
                                    }`
                              }
                              arrow
                            >
                              <span>
                                <IconButton
                                  color={checked ? "success" : "default"}
                                  size="medium"
                                  sx={{
                                    bgcolor: checked
                                      ? "#e6f4ea"
                                      : "transparent",
                                    borderRadius: 2,
                                    transition: "0.2s",
                                  }}
                                  disabled={loading}
                                  onClick={() => handleToggle(mod.id, perm.id)}
                                >
                                  {checked ? (
                                    <CheckIcon color="success" />
                                  ) : (
                                    <RemoveIcon color="disabled" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
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
