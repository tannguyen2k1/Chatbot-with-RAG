import {
  IconUserCircle,
  IconPackage,
  IconFileCheck,
  IconHome,
  IconDatabase,
  IconShieldLock,
  IconMessageCircle,
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
    title: "Home",
    icon: IconHome,
    href: "/home",
  },
  {
    id: uniqueId(),
    title: "Demo",
    icon: IconDatabase,
    href: "/apps/demos",
  },
  {
    id: uniqueId(),
    title: "Systems",
    icon: IconPackage,
    href: "/systems/",
    children: [
      {
        id: uniqueId(),
        title: "UserManagement",
        icon: IconUserCircle,
        href: "/systems/user-management",
      },
      {
        id: uniqueId(),
        title: "RoleManagement",
        icon: IconPackage,
        href: "/systems/role-management",
      },
      {
        id: uniqueId(),
        title: "PermissionManagement",
        icon: IconShieldLock,
        href: "/systems/permission-management",
      },
      {
        id: uniqueId(),
        title: "AuditLog",
        icon: IconFileCheck,
        href: "/systems/audit-log",
      },
    ],
  },
];

export default Menuitems;
