import { lazy } from "react";
import { Navigate, Outlet } from "react-router-dom";

import AuthGuard from "./auth/AuthGuard";
import { authRoles } from "./auth/authRoles";

import Loadable from "./components/Loadable";
import RoleManagement from "app/views/roles/RoleManagement";
import MatxLayout from "./components/MatxLayout/MatxLayout";
import sessionRoutes from "./views/sessions/session-routes";
import materialRoutes from "app/views/material-kit/MaterialRoutes";
import NavigationGuard from "./components/NavigationGuard";

// E-CHART PAGE
const AppEchart = Loadable(lazy(() => import("app/views/charts/echarts/AppEchart")));
// DASHBOARD PAGE
const Analytics = Loadable(lazy(() => import("app/views/dashboard/Analytics")));

// USER MANAGEMENT PAGE
const UserList = Loadable(lazy(() => import("app/views/users/UserList")));
const UserProfile = Loadable(lazy(() => import("app/views/users/UserProfile")));

// DEMO MANAGEMENT PAGE (fix for React element)
const DemoList = lazy(() => import("app/views/demos/DemoList"));
const LoadableComponentDemoList = Loadable(DemoList);

const routes = [
  { path: "/", element: <Navigate to="dashboard/default" /> },
  {
    element: (
      <AuthGuard>
        <MatxLayout />
      </AuthGuard>
    ),
    children: [
      {
        element: (
          <NavigationGuard>
            <Outlet />
          </NavigationGuard>
        ),
        children: [
          ...materialRoutes,
          // dashboard route
          { path: "/dashboard/default", element: <Analytics />, auth: authRoles.admin },
          // e-chart route
          { path: "/charts/echarts", element: <AppEchart />, auth: authRoles.editor },
          // user management
          { path: "/users", element: <UserList />, auth: authRoles.admin },
          // permission management
          // role management
          { path: "/roles", element: <RoleManagement />, auth: authRoles.admin },
          // demo management
          { path: "/demos", element: <LoadableComponentDemoList />, auth: authRoles.admin },
          // user profile
          { path: "/profile", element: <UserProfile /> }
        ]
      }
    ]
  },
  // session pages route
  ...sessionRoutes
];

export default routes;
