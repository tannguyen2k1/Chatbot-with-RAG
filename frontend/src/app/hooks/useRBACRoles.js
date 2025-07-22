import { useEffect, useState } from "react";
import { fetchAllRoles } from "app/utils/rbacApi";
import { useAuthCustom } from "app/contexts/AuthContext";

export function useRBACRoles() {
  const { token } = useAuthCustom();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function fetchRoles() {
      setLoading(true);
      try {
        const data = await fetchAllRoles(token);
        if (isMounted) setRoles(data);
      } catch (e) {
        if (isMounted) setError(e.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchRoles();
    return () => { isMounted = false; };
  }, [token]);

  return { roles, loading, error };
}
