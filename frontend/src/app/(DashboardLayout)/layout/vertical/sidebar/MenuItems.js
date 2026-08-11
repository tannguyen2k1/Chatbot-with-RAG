import { uniqueId } from "lodash";
import {
  IconUserCircle,
  IconPackage,
  IconFileCheck,
  IconMessageCircle,
  IconLayoutDashboard,
  IconAdjustments,
} from "@tabler/icons-react";

const Menuitems = [
  {
    navlabel: true,
    subheader: "Ứng dụng",
  },
  {
    id: uniqueId(),
    title: "Chat",
    icon: IconMessageCircle,
    href: "/",
    chipColor: "secondary",
  },
  {
    navlabel: true,
    subheader: "Quản trị",
  },
  {
    id: uniqueId(),
    title: "AdminOverview",
    icon: IconLayoutDashboard,
    href: "/admin",
    chipColor: "secondary",
    permission: "user.view",
  },
  {
    id: uniqueId(),
    title: "ChatConfig",
    icon: IconAdjustments,
    href: "/admin/chat-config",
    chipColor: "secondary",
    permission: "config.view",
  },
  {
    id: uniqueId(),
    title: "UserManagement",
    icon: IconUserCircle,
    chipColor: "secondary",
    href: "/systems/user-management",
    permission: "user.view",
  },
  {
    id: uniqueId(),
    title: "RoleManagement",
    icon: IconPackage,
    chipColor: "secondary",
    href: "/systems/role-management",
    permission: "role.view",
  },
  {
    id: uniqueId(),
    title: "AuditLog",
    icon: IconFileCheck,
    chipColor: "secondary",
    href: "/systems/audit-log",
    permission: "audit_log.view",
  },
];

export default Menuitems;
