import { uniqueId } from "lodash";
import {
  IconUserCircle,
  IconPackage,
  IconFileCheck,
  IconMessageCircle,
  IconLayoutDashboard,
  IconAdjustments,
  IconBooks,
  IconHelp,
  IconTicket,
  IconChartBar,
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
    subheader: "Cán bộ",
    // shown if any following staff items visible
  },
  {
    id: uniqueId(),
    title: "StaffTickets",
    icon: IconTicket,
    href: "/admin/tickets",
    chipColor: "secondary",
    permission: "ticket.view",
  },
  {
    id: uniqueId(),
    title: "FAQ",
    icon: IconHelp,
    href: "/admin/faqs",
    chipColor: "secondary",
    permission: "faq.view",
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
    title: "KnowledgeBase",
    icon: IconBooks,
    href: "/admin/knowledge",
    chipColor: "secondary",
    permission: "document.view",
  },
  {
    id: uniqueId(),
    title: "Stats",
    icon: IconChartBar,
    href: "/admin/stats",
    chipColor: "secondary",
    permission: "stats.view",
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
