import Menudata from "../Menudata";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import useMediaQuery from "@mui/material/useMediaQuery";
import NavItem from "../NavItem/NavItem";
import NavCollapse from "../NavCollapse/NavCollapse";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import { UserDataContext } from "@/app/context/UserDataContext";
import { hasPermission } from "@/app/utils/auth/hasPermission";
import { useContext } from "react";

const filterByPermission = (items, permissions) =>
  items
    .map((item) => {
      if (item.children) {
        const children = filterByPermission(item.children, permissions);
        if (children.length === 0) return null;
        return { ...item, children };
      }
      if (item.permission) {
        const [module, action] = item.permission.split(".");
        if (!hasPermission(permissions, module, action)) return null;
      }
      return item;
    })
    .filter(Boolean);

const NavListing = () => {
  const pathname = usePathname();
  const pathDirect = pathname;
  const pathWithoutLastPart = pathname.slice(0, pathname.lastIndexOf("/"));
  const { isCollapse, isSidebarHover } = useContext(CustomizerContext);
  const { user } = useContext(UserDataContext);

  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const hideMenu = lgUp ? isCollapse == "mini-sidebar" && !isSidebarHover : "";
  const visibleItems = filterByPermission(Menudata, user?.permissions);

  return (
    <Box>
      <List sx={{ p: 0, display: "flex", gap: "3px", zIndex: "100" }}>
        {visibleItems.map((item) => {
          if (item.children) {
            return (
              <NavCollapse
                menu={item}
                pathDirect={pathDirect}
                hideMenu={hideMenu}
                pathWithoutLastPart={pathWithoutLastPart}
                level={1}
                key={item.id}
                onClick={undefined}
              />
            );
          } else {
            return (
              <NavItem
                item={item}
                key={item.id}
                pathDirect={pathDirect}
                hideMenu={hideMenu}
                onClick={function () {
                  throw new Error("Function not implemented.");
                }}
              />
            );
          }
        })}
      </List>
    </Box>
  );
};
export default NavListing;
