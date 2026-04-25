import { uniqueId } from "lodash";

import {
  IconUserCircle,
  IconPackage,
  IconFileCheck,
  IconHome,
} from "@tabler/icons-react";

const Menuitems = [
  {
    navlabel: true,
    subheader: "Home",
  },

  {
    id: uniqueId(),
    title: "Home",
    icon: IconHome,
    href: "/home",
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
    title: "TenantManagement",
    icon: IconHome,
    chipColor: "secondary",
    href: "/systems/tenant-management",
    permission: "tenant.view",
  },
  {
    id: uniqueId(),
    title: "AuditLog",
    icon: IconFileCheck,
    chipColor: "secondary",
    href: "/systems/audit-log",
    permission: "audit_log.view",
  }
];

export default Menuitems;
