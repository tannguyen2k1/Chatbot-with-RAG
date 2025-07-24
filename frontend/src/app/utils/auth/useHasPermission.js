import { useContext } from "react";
import { UserDataContext } from "@/app/context/UserDataContext";
import { hasPermission as _hasPermission } from "./hasPermission";

// Hook tiện dụng: chỉ cần truyền module, action, tự lấy quyền user đang đăng nhập
export function useHasPermission(module, action) {
  const { user } = useContext(UserDataContext);
  // user.permissions có thể là object hoặc array
  if (!user || !user.permissions) return false;
  return _hasPermission(user.permissions, module, action);
}

// Cách dùng:
// const canEdit = useHasPermission('user', 'update');
