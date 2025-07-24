"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Stack,
  Snackbar,
  Alert,
  CircularProgress,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { getFetcher, putFetcher } from "@/app/api/globalFetcher";

export default function PermissionManagementPage() {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [rolePerms, setRolePerms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getFetcher("/api/rbac/roles"),
      getFetcher("/api/rbac/modules"),
      getFetcher("/api/rbac/permissions"),
    ])
      .then(([roles, modules, permissions]) => {
        setRoles(roles);
        setModules(modules);
        setPermissions(permissions);
        if (roles.length > 0) setSelectedRole(roles[0].id);
      })
      .catch((e) => {
        setSnackbar({ open: true, message: e.message, severity: "error" });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedRole) {
      setLoading(true);
      getFetcher(`/api/rbac/roles`)
        .then((data) => {
          const role = data.find((r) => r.id === selectedRole);
          setRolePerms(role?.permissions || []);
        })
        .catch(() => setRolePerms([]))
        .finally(() => setLoading(false));
    }
  }, [selectedRole]);

  const handleToggle = async (moduleId, permissionId) => {
    setLoading(true);
    const hasPerm = rolePerms.some(
      (p) => p.module_id === moduleId && p.permission_id === permissionId
    );
    try {
      await putFetcher(`/api/rbac/roles/${selectedRole}/permission`, {
        module_id: moduleId,
        permission_id: permissionId,
        action: hasPerm ? "remove" : "add",
      });
      setSnackbar({
        open: true,
        message: hasPerm ? "Đã tắt quyền" : "Đã bật quyền",
        severity: "success",
      });
      setRolePerms((rp) =>
        hasPerm
          ? rp.filter(
              (p) =>
                !(p.module_id === moduleId && p.permission_id === permissionId)
            )
          : [...rp, { module_id: moduleId, permission_id: permissionId }]
      );
    } catch (e) {
      setSnackbar({ open: true, message: e.message, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Typography variant="h4" fontWeight={700} color="primary.main" mb={3}>
        Quản lý quyền cho vai trò
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <FormControl size="small">
          <InputLabel>Vai trò</InputLabel>
          <Select
            value={selectedRole}
            label="Vai trò"
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            {roles.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      {loading ? (
        <CircularProgress />
      ) : (
        <Box>
          {modules.map((m) => (
            <Box key={m.id} mb={2}>
              <Typography fontWeight={600}>{m.name}</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {permissions
                  .filter((p) => p.module_id === m.id)
                  .map((p) => {
                    const checked = rolePerms.some(
                      (rp) => rp.module_id === m.id && rp.permission_id === p.id
                    );
                    return (
                      <Button
                        key={p.id}
                        variant={checked ? "contained" : "outlined"}
                        color={checked ? "success" : "primary"}
                        size="small"
                        sx={{ mb: 1 }}
                        onClick={() => handleToggle(m.id, p.id)}
                      >
                        {p.name}
                      </Button>
                    );
                  })}
              </Stack>
            </Box>
          ))}
        </Box>
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
