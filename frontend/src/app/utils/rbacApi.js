

// RBAC API helpers for PermissionManagement
import { BASE_API_URL } from "app/config";

export async function fetchAllRoles(token) {
  const res = await fetch(`${BASE_API_URL}/rbac/roles`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error("Không lấy được danh sách role");
  return await res.json();
}

export async function removePermissionFromRole(roleId, moduleId, permissionId, token) {
  const res = await fetch(`${BASE_API_URL}/rbac/remove-permission`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ role_id: roleId, module_id: moduleId, permission_id: permissionId })
  });
  if (!res.ok) throw new Error("Xoá permission khỏi role thất bại");
  return await res.json();
}

export async function createRole(name, description, token) {
  const res = await fetch(`${BASE_API_URL}/rbac/roles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ name, description })
  });
  if (!res.ok) throw new Error("Tạo role thất bại");
  return await res.json();
}

export async function deleteRole(roleId, token) {
  const res = await fetch(`${BASE_API_URL}/rbac/roles/${roleId}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error("Xoá role thất bại");
  return await res.json();
}

export async function assignRoleToUser(userId, roleId, token) {
  const res = await fetch(`${BASE_API_URL}/rbac/assign-role`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ user_id: userId, role_id: roleId })
  });
  if (!res.ok) throw new Error("Gán role thất bại");
  return await res.json();
}

export async function fetchAllModules(token) {
  const res = await fetch(`${BASE_API_URL}/rbac/modules`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error("Không lấy được danh sách module");
  return await res.json();
}

export async function fetchAllPermissions(token) {
  const res = await fetch(`${BASE_API_URL}/rbac/permissions`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error("Không lấy được danh sách permission");
  return await res.json();
}

export async function assignPermissionToRole(roleId, moduleId, permissionId, token) {
  const res = await fetch(`${BASE_API_URL}/rbac/assign-permission`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ role_id: roleId, module_id: moduleId, permission_id: permissionId })
  });
  if (!res.ok) throw new Error("Gán permission cho role thất bại");
  return await res.json();
}
