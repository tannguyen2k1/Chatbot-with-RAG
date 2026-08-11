import Menuitems from "./MenuItems";
import { hasPermission } from "@/app/utils/auth/hasPermission";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import useMediaQuery from "@mui/material/useMediaQuery";
import NavItem from "./NavItem";
import NavCollapse from "./NavCollapse";
import NavGroup from "./NavGroup/NavGroup";
import { useContext } from "react";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import { UserDataContext } from "@/app/context/UserDataContext";

const SidebarItems = () => {
  const pathname = usePathname();
  const pathDirect = pathname;
  const pathWithoutLastPart = pathname.slice(0, pathname.lastIndexOf("/"));
  const { isSidebarHover, isCollapse, isMobileSidebar, setIsMobileSidebar } =
    useContext(CustomizerContext);
  const { user } = useContext(UserDataContext);

  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const hideMenu = lgUp ? isCollapse == "mini-sidebar" && !isSidebarHover : "";

  const visibleItems = (() => {
    const filtered = [];
    for (let i = 0; i < Menuitems.length; i++) {
      const item = Menuitems[i];
      if (item.subheader) {
        const hasFollowingItem = Menuitems.slice(i + 1).some((next) => {
          if (next.subheader) return false;
          if (!next.permission) return true;
          const [module, action] = next.permission.split(".");
          return hasPermission(user?.permissions, module, action);
        });
        if (hasFollowingItem) filtered.push(item);
        continue;
      }
      if (item.permission) {
        const [module, action] = item.permission.split(".");
        if (!hasPermission(user?.permissions, module, action)) continue;
      }
      filtered.push(item);
    }
    return filtered;
  })();

  return (
    <Box sx={{ px: 3 }}>
      <List sx={{ pt: 0 }} className="sidebarNav">
        {visibleItems.map((item) => {
          if (item.subheader) {
            return (
              <NavGroup item={item} hideMenu={hideMenu} key={item.subheader} />
            );
          } else if (item.children) {
            return (
              <NavCollapse
                menu={item}
                pathDirect={pathDirect}
                hideMenu={hideMenu}
                pathWithoutLastPart={pathWithoutLastPart}
                level={1}
                key={item.id}
                onClick={() => setIsMobileSidebar(!isMobileSidebar)}
              />
            );
          } else {
            return (
              <NavItem
                item={item}
                key={item.id}
                pathDirect={pathDirect}
                hideMenu={hideMenu}
                onClick={() => setIsMobileSidebar(!isMobileSidebar)}
              />
            );
          }
        })}
      </List>
    </Box>
  );
};
export default SidebarItems;
