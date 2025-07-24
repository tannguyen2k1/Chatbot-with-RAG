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
    title: "Demos",
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
    title: "Quản lý người dùng",
    icon: IconUserCircle,
    chipColor: "secondary",
    href: "/systems/user-management",
    permission: "user.view",
  },
  {
    id: uniqueId(),
    title: "Quản lý vai trò",
    icon: IconFileCheck,
    chipColor: "secondary",
    href: "/systems/role-management",
    permission: "role.view",
  },
];

export default Menuitems;
