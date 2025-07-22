// Không dùng hook trong file module, chỉ dùng trong component
// Thay vào đó, export mảng đầy đủ và filter trong component Sidenav
const navigations = [
  { name: "Dashboard", path: "/dashboard/default", icon: "dashboard" },
  { label: "PAGES", type: "label" },
  { name: "Quản lý Demo", icon: "list", path: "/demos", iconText: "D", permission: { module: "demo", action: "view" } },
  {
    name: "Quản lý hệ thống",
    icon: "settings",
    iconText: "S",
    children: [
      { name: "Quản lý người dùng", icon: "person", path: "/users", iconText: "U", permission: { module: "user", action: "view" } },
      { name: "Quản lý Roles", icon: "security", path: "/roles", iconText: "R", permission: { module: "role", action: "view" } }
    ]
  },
  {
    name: "Components",
    icon: "favorite",
    badge: { value: "30+", color: "secondary" },
    children: [
      { name: "Auto Complete", path: "/material/autocomplete", iconText: "A" },
      { name: "Buttons", path: "/material/buttons", iconText: "B" },
      { name: "Checkbox", path: "/material/checkbox", iconText: "C" },
      { name: "Dialog", path: "/material/dialog", iconText: "D" },
      { name: "Expansion Panel", path: "/material/expansion-panel", iconText: "E" },
      { name: "Form", path: "/material/form", iconText: "F" },
      { name: "Icons", path: "/material/icons", iconText: "I" },
      { name: "Menu", path: "/material/menu", iconText: "M" },
      { name: "Progress", path: "/material/progress", iconText: "P" },
      { name: "Radio", path: "/material/radio", iconText: "R" },
      { name: "Switch", path: "/material/switch", iconText: "S" },
      { name: "Slider", path: "/material/slider", iconText: "S" },
      { name: "Snackbar", path: "/material/snackbar", iconText: "S" },
      { name: "Table", path: "/material/table", iconText: "T" }
    ]
  },
  {
    name: "Charts",
    icon: "trending_up",
    children: [{ name: "Echarts", path: "/charts/echarts", iconText: "E" }]
  },
  {
    name: "Documentation",
    icon: "launch",
    type: "extLink",
    path: "http://demos.ui-lib.com/matx-react-doc/"
  }
];

export default navigations;
