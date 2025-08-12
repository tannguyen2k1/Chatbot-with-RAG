// Hàm kiểm tra quyền cho user hiện tại (dùng giống fullstackhero)
// userPermissions: object dạng { [module]: [action, ...] } hoặc mảng string ['user.view', ...]
// module: tên module, action: tên action ("view", "create", ...)

export function hasPermission(userPermissions, module, action) {
  if (!userPermissions || !module || !action) return false;
  // Nếu userPermissions là object dạng { user: ["user.view", ...] }
  if (typeof userPermissions === "object" && !Array.isArray(userPermissions)) {
    const actions = userPermissions[module];
    if (!actions) return false;
    // Chỉ kiểm tra dạng "module.action" đúng với backend trả về
    return actions.includes(`${module}.${action}`);
  }
  // Nếu userPermissions là mảng string ['user.view', ...]
  if (Array.isArray(userPermissions)) {
    return userPermissions.includes(`${module}.${action}`);
  }
  return false;
}

// Ví dụ sử dụng:
// hasPermission(user.permissions, 'user', 'view')
// hasPermission(user.permissions, 'role', 'delete')
