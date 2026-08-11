import {
  IconUserCircle,
  IconPackage,
  IconFileCheck,
  IconMessageCircle,
  IconLayoutDashboard,
  IconAdjustments,
} from "@tabler/icons-react";

import { uniqueId } from "lodash";

const Menuitems = [
  {
    id: uniqueId(),
    title: "Chat",
    icon: IconMessageCircle,
    href: "/",
  },
  {
    id: uniqueId(),
    title: "Administration",
    icon: IconPackage,
    href: "/admin",
    children: [
      {
        id: uniqueId(),
        title: "AdminOverview",
        icon: IconLayoutDashboard,
        href: "/admin",
        permission: "user.view",
      },
      {
        id: uniqueId(),
        title: "ChatConfig",
        icon: IconAdjustments,
        href: "/admin/chat-config",
        permission: "config.view",
      },
      {
        id: uniqueId(),
        title: "UserManagement",
        icon: IconUserCircle,
        href: "/systems/user-management",
        permission: "user.view",
      },
      {
        id: uniqueId(),
        title: "RoleManagement",
        icon: IconPackage,
        href: "/systems/role-management",
        permission: "role.view",
      },
      {
        id: uniqueId(),
        title: "AuditLog",
        icon: IconFileCheck,
        href: "/systems/audit-log",
        permission: "audit_log.view",
      },
    ],
  },
];

export default Menuitems;
