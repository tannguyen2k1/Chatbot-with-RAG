import { uniqueId } from "lodash";

import {
  IconUserCircle,
  IconPackage,
  IconAperture,
  IconFileCheck,
} from "@tabler/icons-react";

const Menuitems = [
  {
    navlabel: true,
    subheader: "Home",
  },

  {
    id: uniqueId(),
    title: "Modern",
    icon: IconAperture,
    href: "/",
    chipColor: "secondary",
  },
  {
    navlabel: true,
    subheader: "Apps",
  },
  {
    id: uniqueId(),
    title: "Demo",
    icon: IconPackage,
    chipColor: "secondary",
    href: "/apps/demos",
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
    icon: IconPackage, // Changed to IconPackage for roles
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
