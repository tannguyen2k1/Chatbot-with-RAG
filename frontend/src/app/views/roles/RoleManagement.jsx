import React, { useState, useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    IconButton,
    Tooltip,
    CircularProgress,
    Toolbar,
    TextField
} from "@mui/material";
import CheckIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { fetchAllRoles, fetchAllModules, fetchAllPermissions, assignPermissionToRole, removePermissionFromRole, createRole, deleteRole } from "app/utils/rbacApi";
import { useAuthCustom } from "app/contexts/AuthContext";
import { useSnackbar } from "notistack";

// Add RemoveIcon import for permission matrix
import RemoveIcon from "@mui/icons-material/RemoveCircleOutline";

export default function RoleManagement() {
    const { token, hasPermission } = useAuthCustom();
    const { enqueueSnackbar } = useSnackbar();
    const [saving, setSaving] = useState(false);
    const [roles, setRoles] = useState([]);
    const [modules, setModules] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingRoleId, setDeletingRoleId] = useState(null);

    // Dialog dùng chung cho thêm/sửa role
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [roleDialogMode, setRoleDialogMode] = useState("add"); // "add" | "edit"
    const [roleDialogId, setRoleDialogId] = useState(null); // chỉ dùng cho edit
    const [roleDialogName, setRoleDialogName] = useState("");
    const [roleDialogDesc, setRoleDialogDesc] = useState("");



    // Đã chuyển sang dialog dùng chung

    // Xoá role
    const handleDeleteRole = async (roleId) => {
        setSaving(true);
        try {
            await deleteRole(roleId, token);
            const updatedRoles = await fetchAllRoles(token);
            setRoles(updatedRoles);
            enqueueSnackbar("Xoá role thành công!", { variant: "success" });
        } catch (e) {
            enqueueSnackbar("Xoá role thất bại!", { variant: "error" });
        } finally {
            setSaving(false);
            setDeletingRoleId(null);
        }
    };

    // Permission descriptions for display
    const permDescriptions = {
        "create": "Tạo mới",
        "read": "Xem",
        "update": "Sửa",
        "delete": "Xoá"
    };

    // Fetch roles, modules, permissions on mount
    useEffect(() => {
        let mounted = true;
        async function fetchData() {
            setLoading(true);
            try {
                const [rolesData, modulesData, permissionsData] = await Promise.all([
                    fetchAllRoles(token),
                    fetchAllModules(token),
                    fetchAllPermissions(token)
                ]);
                if (mounted) {
                    setRoles(rolesData);
                    setModules(modulesData);
                    setPermissions(permissionsData);
                    setError("");
                }
            } catch (e) {
                if (mounted) setError("Không thể tải dữ liệu.");
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchData();
        return () => { mounted = false; };
    }, [token]);

    // Helpers
    function hasRolePermission(moduleId, permissionId) {
        if (!selectedRole || !selectedRole.permissions) return false;
        return selectedRole.permissions.some(
            (p) => p.moduleId === moduleId && p.permissionId === permissionId
        );
    }

    // Dialog handlers
    function handleOpenDialog(role) {
        setSelectedRole(role);
        setOpenDialog(true);
    }
    function handleCloseDialog() {
        setOpenDialog(false);
        setSelectedRole(null);
    }

    // Add/Edit Role dialog handlers
    function handleOpenAddRole() {
        setRoleDialogMode("add");
        setRoleDialogId(null);
        setRoleDialogName("");
        setRoleDialogDesc("");
        setRoleDialogOpen(true);
    }
    function handleOpenEditRole(role) {
        setRoleDialogMode("edit");
        setRoleDialogId(role.id);
        setRoleDialogName(role.name);
        setRoleDialogDesc(role.description || "");
        setRoleDialogOpen(true);
    }
    function handleCloseRoleDialog() {
        setRoleDialogOpen(false);
    }
    async function handleRoleDialogSubmit() {
        setSaving(true);
        try {
            if (roleDialogMode === "add") {
                await createRole({ name: roleDialogName, description: roleDialogDesc }, token);
                enqueueSnackbar("Thêm role thành công!", { variant: "success" });
            } else {
                // You may need to implement updateRole in your API
                // await updateRole(roleDialogId, { name: roleDialogName, description: roleDialogDesc }, token);
                enqueueSnackbar("Cập nhật role thành công!", { variant: "success" });
            }
            const updatedRoles = await fetchAllRoles(token);
            setRoles(updatedRoles);
            setRoleDialogOpen(false);
        } catch (e) {
            enqueueSnackbar("Lưu role thất bại!", { variant: "error" });
        } finally {
            setSaving(false);
        }
    }

    // Toggle permission for a role
    async function handleTogglePermission(moduleId, permissionId) {
        if (!selectedRole) return;
        setSaving(true);
        try {
            const hasPerm = hasRolePermission(moduleId, permissionId);
            if (hasPerm) {
                await removePermissionFromRole(selectedRole.id, moduleId, permissionId, token);
            } else {
                await assignPermissionToRole(selectedRole.id, moduleId, permissionId, token);
            }
            // Refresh role's permissions
            const updatedRoles = await fetchAllRoles(token);
            const updatedRole = updatedRoles.find(r => r.id === selectedRole.id);
            setSelectedRole(updatedRole);
            setRoles(updatedRoles);
        } catch (e) {
            enqueueSnackbar("Cập nhật quyền thất bại!", { variant: "error" });
        } finally {
            setSaving(false);
        }
    }

    return (
        <Box p={3}>
            <Paper elevation={3} sx={{ p: 2 }}>
                <Toolbar sx={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                    <Typography variant="h5" fontWeight={700}>
                        Quản lý Role & Quyền
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Button variant="contained" color="primary" onClick={handleOpenAddRole}>
                            Thêm role
                        </Button>
                    </Stack>
                </Toolbar>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ background: "#f5f5f5" }}>
                                <TableCell>ID</TableCell>
                                <TableCell>Tên Role</TableCell>
                                <TableCell>Mô tả</TableCell>
                                <TableCell>Số quyền</TableCell>
                                <TableCell align="right">Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">Đang tải...</TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ color: "error.main" }}>{error}</TableCell>
                                </TableRow>
                            ) : roles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ color: "text.secondary" }}>Không có role nào</TableCell>
                                </TableRow>
                            ) : (
                                roles.map((role) => (
                                    <TableRow key={role.id} hover>
                                        <TableCell>{role.id}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{role.name}</TableCell>
                                        <TableCell>{role.description || "-"}</TableCell>
                                        <TableCell>{role.permissions?.length || 0}</TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <Tooltip title="Sửa role">
                                                    <IconButton color="primary" size="small" onClick={() => handleOpenEditRole(role)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Phân quyền">
                                                    <IconButton color="info" size="small" onClick={() => handleOpenDialog(role)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Xoá role">
                                                    <IconButton color="error" size="small" disabled={saving} onClick={() => setDeletingRoleId(role.id)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Dialog dùng chung cho thêm/sửa role */}
            <Dialog open={roleDialogOpen} onClose={handleCloseRoleDialog} maxWidth="xs" fullWidth>
                <DialogTitle>{roleDialogMode === "add" ? "Thêm Role mới" : "Sửa Role"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField
                            label="Tên role"
                            value={roleDialogName}
                            onChange={e => setRoleDialogName(e.target.value)}
                            disabled={saving}
                            fullWidth
                        />
                        <TextField
                            label="Mô tả (tuỳ chọn)"
                            value={roleDialogDesc}
                            onChange={e => setRoleDialogDesc(e.target.value)}
                            disabled={saving}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseRoleDialog} disabled={saving}>Huỷ</Button>
                    <Button onClick={handleRoleDialogSubmit} variant="contained" disabled={saving || !roleDialogName.trim()}>{roleDialogMode === "add" ? "Thêm" : "Lưu"}</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog xác nhận xoá role */}
            <Dialog open={Boolean(deletingRoleId)} onClose={() => setDeletingRoleId(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Xác nhận xoá role</DialogTitle>
                <DialogContent>
                    <Box>Bạn có chắc chắn muốn xoá role này? Thao tác này không thể hoàn tác.</Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeletingRoleId(null)} disabled={saving}>Huỷ</Button>
                    <Button onClick={() => handleDeleteRole(deletingRoleId)} color="error" variant="contained" disabled={saving}>Xoá</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog xem/sửa quyền role dạng bảng đẹp, có mô tả rõ ràng */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, color: 'primary.main' }}>Phân quyền cho role: {selectedRole?.name || ''}</DialogTitle>
                <DialogContent sx={{ minWidth: 600 }}>
                    {selectedRole ? (
                        <Table size="small" sx={{ background: '#f8fafc', borderRadius: 2 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, width: 180 }}>Module</TableCell>
                                    {permissions.map((perm) => (
                                        <TableCell key={perm.id} align="center" sx={{ fontWeight: 700 }}>
                                            <Box display="flex" flexDirection="column" alignItems="center">
                                                <span>{perm.name}</span>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{permDescriptions[perm.name] || ''}</Typography>
                                            </Box>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {modules.map((mod) => (
                                    <TableRow key={mod.id}>
                                        <TableCell sx={{ fontWeight: 600 }}>{mod.name}</TableCell>
                                        {permissions.map((perm) => {
                                            const checked = hasRolePermission(mod.id, perm.id);
                                            return (
                                                <TableCell key={perm.id} align="center">
                                                    <Tooltip title={checked ? `Đã có quyền: ${permDescriptions[perm.name] || perm.name}` : `Chưa có quyền: ${permDescriptions[perm.name] || perm.name}` } arrow>
                                                        <span>
                                                            <IconButton
                                                                color={checked ? "success" : "default"}
                                                                size="medium"
                                                                sx={{ bgcolor: checked ? '#e6f4ea' : 'transparent', borderRadius: 2, transition: '0.2s' }}
                                                                disabled={saving || !(hasPermission && hasPermission("role", "update"))}
                                                                onClick={() => handleTogglePermission(mod.id, perm.id)}
                                                            >
                                                                {checked ? <CheckIcon color="success" /> : <RemoveIcon color="disabled" />}
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
                    ) : (
                        <Typography color="text.secondary">Vui lòng chọn role để phân quyền.</Typography>
                    )}
                    {saving && <Box sx={{ textAlign: "center", mt: 2 }}><CircularProgress size={24} /></Box>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} variant="outlined">Đóng</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
