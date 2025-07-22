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
    Toolbar
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
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleDesc, setNewRoleDesc] = useState("");
    const [deletingRoleId, setDeletingRoleId] = useState(null);

    // State for edit role dialog
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editRoleId, setEditRoleId] = useState(null);
    const [editRoleName, setEditRoleName] = useState("");
    const [editRoleDesc, setEditRoleDesc] = useState("");

    // Handler to open edit dialog and set current role info
    const handleEditRole = (role) => {
        setEditRoleId(role.id);
        setEditRoleName(role.name || "");
        setEditRoleDesc(role.description || "");
        setEditDialogOpen(true);
    };

    // Handler to save edited role (placeholder, implement updateRole API later)
    const handleSaveEditRole = async () => {
        // TODO: Implement updateRole API and update logic here
        setSaving(true);
        try {
            // Placeholder: just close dialog and show snackbar
            setEditDialogOpen(false);
            enqueueSnackbar("Chức năng cập nhật role sẽ sớm được bổ sung!", { variant: "info" });
        } catch (e) {
            enqueueSnackbar("Cập nhật role thất bại!", { variant: "error" });
        } finally {
            setSaving(false);
        }
    };


    // Thêm role mới
    const handleAddRole = async () => {
        if (!newRoleName.trim()) return;
        setSaving(true);
        try {
            await createRole(newRoleName, newRoleDesc, token);
            const updatedRoles = await fetchAllRoles(token);
            setRoles(updatedRoles);
            setAddDialogOpen(false);
            setNewRoleName("");
            setNewRoleDesc("");
            enqueueSnackbar("Thêm role thành công!", { variant: "success" });
        } catch (e) {
            enqueueSnackbar("Thêm role thất bại!", { variant: "error" });
        } finally {
            setSaving(false);
        }
    };

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

    useEffect(() => {
        let isMounted = true;
        async function fetchData() {
            setLoading(true);
            try {
                const [rolesData, modulesData, permsData] = await Promise.all([
                    fetchAllRoles(token),
                    fetchAllModules(token),
                    fetchAllPermissions(token)
                ]);
                if (!isMounted) return;
                setRoles(rolesData);
                setModules(modulesData);
                setPermissions(permsData);
            } catch (e) {
                if (isMounted) setError(e.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchData();
        return () => { isMounted = false; };
    }, [token]);

    const handleOpenDialog = (role) => {
        setSelectedRole(role);
        setOpenDialog(true);
    };

    // Kiểm tra role đã có quyền module/permission chưa
    const hasRolePermission = (modId, permId) => {
        if (!selectedRole || !Array.isArray(selectedRole.permissions)) return false;
        return selectedRole.permissions.some(
            (p) => p.module_id === modId && p.permission_id === permId
        );
    };

    // Thêm hoặc xoá quyền cho role
    const handleTogglePermission = async (modId, permId) => {
        if (!selectedRole) return;
        setSaving(true);
        try {
            const checked = hasRolePermission(modId, permId);
            if (checked) {
                await removePermissionFromRole(selectedRole.id, modId, permId, token);
            } else {
                await assignPermissionToRole(selectedRole.id, modId, permId, token);
            }
            // Sau khi cập nhật quyền, reload lại role hiện tại
            const updatedRoles = await fetchAllRoles(token);
            const updated = updatedRoles.find((r) => r.id === selectedRole.id);
            setSelectedRole(updated);
            setRoles(updatedRoles);
            enqueueSnackbar("Cập nhật quyền thành công!", { variant: "success" });
        } catch (e) {
            enqueueSnackbar("Cập nhật quyền thất bại!", { variant: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedRole(null);
    };

    // UI: cho phép sửa quyền role nếu có quyền
    // Mô tả quyền phổ biến
    const permDescriptions = {
        view: 'Xem dữ liệu',
        create: 'Thêm mới',
        update: 'Chỉnh sửa',
        delete: 'Xoá',
        manage: 'Quản lý đặc biệt',
    };
    return (
        <Box p={3}>
            <Paper elevation={3} sx={{ p: 2 }}>
                <Toolbar sx={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                    <Typography variant="h5" fontWeight={700} color="primary.main">
                        Quản lý Role & Quyền
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Button variant="contained" color="primary" onClick={() => setAddDialogOpen(true)}>
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
                                                {/* <Tooltip title="Sửa role">
                                                    <IconButton color="primary" size="small" onClick={() => handleEditRole(role)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip> */}
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
            {/* Dialog sửa role */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Sửa Role</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <input
                            type="text"
                            placeholder="Tên role"
                            value={editRoleName}
                            onChange={e => setEditRoleName(e.target.value)}
                            style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', fontSize: 16 }}
                            disabled={saving}
                        />
                        <input
                            type="text"
                            placeholder="Mô tả (tuỳ chọn)"
                            value={editRoleDesc}
                            onChange={e => setEditRoleDesc(e.target.value)}
                            style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', fontSize: 16 }}
                            disabled={saving}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)} disabled={saving}>Huỷ</Button>
                    <Button onClick={handleSaveEditRole} variant="contained" disabled={saving || !editRoleName.trim()}>Lưu</Button>
                </DialogActions>
            </Dialog>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            {/* Dialog thêm role */}
            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Thêm Role mới</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <input
                            type="text"
                            placeholder="Tên role"
                            value={newRoleName}
                            onChange={e => setNewRoleName(e.target.value)}
                            style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', fontSize: 16 }}
                            disabled={saving}
                        />
                        <input
                            type="text"
                            placeholder="Mô tả (tuỳ chọn)"
                            value={newRoleDesc}
                            onChange={e => setNewRoleDesc(e.target.value)}
                            style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', fontSize: 16 }}
                            disabled={saving}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDialogOpen(false)} disabled={saving}>Huỷ</Button>
                    <Button onClick={handleAddRole} variant="contained" disabled={saving || !newRoleName.trim()}>Thêm</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog xác nhận xoá role */}
            <Dialog open={!!deletingRoleId} onClose={() => setDeletingRoleId(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Xác nhận xoá role</DialogTitle>
                <DialogContent>Bạn có chắc chắn muốn xoá role này? Thao tác này không thể hoàn tác.</DialogContent>
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
