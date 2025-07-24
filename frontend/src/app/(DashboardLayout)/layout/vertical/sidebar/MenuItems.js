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
    title: "Contacts",
    icon: IconPackage,
    chipColor: "secondary",
    href: "/apps/contacts",
  },
  {
    navlabel: true,
    subheader: "Systems",
  },
  {
    id: uniqueId(),
    title: "User Management",
    icon: IconUserCircle,
    chipColor: "secondary",
    href: "/apps/user-management",
  },
  {
    id: uniqueId(),
    title: "Role Management",
    icon: IconFileCheck,
    chipColor: "secondary",
    href: "/apps/role-management",
  },
];

export default Menuitems;
