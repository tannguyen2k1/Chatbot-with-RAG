import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Stack,
  Paper
} from "@mui/material";
import { useParams } from "react-router-dom";
import { useUsers, UserProvider } from "app/contexts/UserContext";
import SecurityIcon from "@mui/icons-material/Security";
import { useSnackbar } from "notistack";

function PermissionManagementContent() {
  const { userId } = useParams();
  const { fetchUserModulePermissions, updateUserPermissions, users, fetchUserById } = useUsers();
  const [modulePermissions, setModulePermissions] = useState([]); // dữ liệu từ API
  const [permissions, setPermissions] = useState({}); // { module: [quyền,...] }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { enqueueSnackbar } = useSnackbar();
  const [userInfo, setUserInfo] = useState(null); // lưu thông tin user để lấy username

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch user info từ context API
        const user = await fetchUserById(userId);
        if (!isMounted) return;
        setUserInfo(user);
        if (["root", "admin"].includes(user.role)) {
          setPermissions({ demo: ["view", "create", "update", "delete"] });
        } else {
          setPermissions(user.permissions || {});
          if (!user.permissions || !user.permissions.demo) {
            setPermissions((prev) => ({ ...prev, demo: [] }));
          }
        }
      } catch (e) {
        if (isMounted) setError(e.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [userId, fetchUserById]);

  const handleCheck = (module, action) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: prev[module]?.includes(action)
        ? prev[module].filter((a) => a !== action)
        : [...(prev[module] || []), action]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await updateUserPermissions(userId, permissions);
      enqueueSnackbar("Lưu quyền thành công!", {
        variant: "success",
        anchorOrigin: { vertical: "top", horizontal: "right" }
      });
    } catch (e) {
      setError(e.message);
      enqueueSnackbar(e.message || "Lưu quyền thất bại!", {
        variant: "error",
        anchorOrigin: { vertical: "top", horizontal: "right" }
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Typography>Đang tải...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  const DEMO_ACTIONS = ["view", "create", "update", "delete"];

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700} mb={2} textAlign="center">
          <SecurityIcon color="primary" sx={{ verticalAlign: "middle", mr: 1 }} />
          Phân quyền cho {userInfo?.username || userInfo?.email || `user #${userId}`}
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Card
          variant="outlined"
          sx={{ borderRadius: 2, boxShadow: 0, p: 2, bgcolor: "grey.50", mb: 3 }}
        >
          <Box display="flex" alignItems="center" mb={1}>
            <SecurityIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="subtitle1" fontWeight={600} textTransform="capitalize">
              demo
            </Typography>
          </Box>
          <FormGroup row>
            {DEMO_ACTIONS.map((action) => (
              <FormControlLabel
                key={action}
                control={
                  <Checkbox
                    checked={permissions.demo?.includes(action) || false}
                    onChange={() => {
                      setPermissions((prev) => ({
                        ...prev,
                        demo: prev.demo?.includes(action)
                          ? prev.demo.filter((a) => a !== action)
                          : [...(prev.demo || []), action]
                      }));
                    }}
                    color="primary"
                    disabled={["root", "admin"].includes(userInfo?.role)}
                  />
                }
                label={
                  <Typography sx={{ textTransform: "capitalize", fontWeight: 500 }}>
                    {action}
                  </Typography>
                }
                sx={{ mr: 2, minWidth: 120 }}
              />
            ))}
          </FormGroup>
        </Card>
        <Divider sx={{ my: 3 }} />
        <Box display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSave}
            disabled={saving || ["root", "admin"].includes(userInfo?.role)}
            sx={{ minWidth: 140 }}
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default function PermissionManagementWrapper(props) {
  return (
    <UserProvider>
      <PermissionManagementContent {...props} />
    </UserProvider>
  );
}
