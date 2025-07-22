import { useLocation, Navigate, useMatches } from "react-router-dom";
import { useAuthCustom } from "app/contexts/AuthContext";

export default function NavigationGuard({ children }) {
  return children;
}
