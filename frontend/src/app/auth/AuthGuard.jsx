import { Navigate, useLocation } from "react-router-dom";
// HOOK
import { useAuthCustom } from "app/contexts/AuthContext";

export default function AuthGuard({ children }) {
  const { token } = useAuthCustom();
  const { pathname } = useLocation();

  if (token) return <>{children}</>;

  return <Navigate replace to="/session/signin" state={{ from: pathname }} />;
}
