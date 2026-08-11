import { uniqueId } from "lodash";
import {
  IconUserCircle,
  IconPackage,
  IconFileCheck,
  IconHome,
  IconDatabase,
  IconShieldLock,
  IconMessageCircle,
} from "@tabler/icons-react";

const Menuitems = [
  {
    navlabel: true,
    subheader: "Applications",
  },
  {
    id: uniqueId(),
    title: "Chat",
    icon: IconMessageCircle,
    href: "/",
    chipColor: "secondary",
  },
  {
    id: uniqueId(),
    title: "Home",
    icon: IconHome,
    href: "/home",
    chipColor: "secondary",
  },
  {
    id: uniqueId(),
    title: "Demo",
    icon: IconDatabase,
    href: "/apps/demos",
    chipColor: "secondary",
  },
  {
    navlabel: true,
    subheader: "Systems",
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
    title: "PermissionManagement",
    icon: IconShieldLock,
    chipColor: "secondary",
    href: "/systems/permission-management",
    permission: "permission.view",
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
