"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Tabs,
  Tab,
  Typography,
  Divider,
  Button,
  Select,
  MenuItem,
  FormControl,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog as DialogMUI,
  DialogTitle as DialogTitleMUI,
  DialogContent as DialogContentMUI,
  DialogActions as DialogActionsMUI,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useState, useContext, useEffect, useRef } from "react";
import {
  getFetcher,
  putFetcher,
  deleteFetcher,
  patchFetcher,
} from "@/app/api/globalFetcher";
import { useTheme } from "@mui/material/styles";
import {
  IconX,
  IconPalette,
  IconLanguage,
  IconDatabase,
  IconTrash,
  IconArchive,
  IconSettings,
  IconMoon,
  IconSun,
  IconDeviceDesktop,
  IconBrain,
} from "@tabler/icons-react";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import { useSnackbar } from "@/app/context/SnackbarContext";

const TabPanel = ({ children, value, index, ...other }) => (
  <Box
    role="tabpanel"
    hidden={value !== index}
    id={`settings-tabpanel-${index}`}
    aria-labelledby={`settings-tab-${index}`}
    {...other}
    sx={{ py: 2 }}
  >
    {value === index && children}
  </Box>
);

const SettingsDialog = ({ open, onClose, onRefresh, onClearChat }) => {
  const theme = useTheme();
  const { setActiveMode, setIsLanguage, setIsFontSize } = useContext(CustomizerContext);
  const [tab, setTab] = useState(0);
  const [settings, setSettings] = useState({
    theme: theme.palette.mode,
    language: "vi",
    fontSize: "medium",
  });

  const showSnackbar = useSnackbar();

  const [genericConfirm, setGenericConfirm] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    loading: false,
    confirmColor: "primary",
  });

  const [archivedDialogOpen, setArchivedDialogOpen] = useState(false);
  const [archivedChats, setArchivedChats] = useState([]);
  const [loadingArchived, setLoadingArchived] = useState(false);

  const isInitialGeneral = useRef(true);

  useEffect(() => {
    if (isInitialGeneral.current) {
      isInitialGeneral.current = false;
      return;
    }
    const timer = setTimeout(() => {
      handleSaveGeneralConfig(settings);
    }, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  useEffect(() => {
    if (open && tab === 0) {
      fetchGeneralConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, open]);

  const fetchGeneralConfig = async () => {
    try {
      const data = await getFetcher("/api/configs/general");
      if (!data || typeof data !== "object") return;
      isInitialGeneral.current = true;
      setSettings({
        theme: data.theme || theme.palette.mode || "light",
        language: data.language || "vi",
        fontSize: data.font_size || "medium",
      });
    } catch (err) {
      console.error("Failed to fetch general config:", err);
    }
  };

  const handleChange = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setSettings({ ...settings, [field]: value });
  };

  const handleSaveGeneralConfig = async (currentSettings) => {
    const s = currentSettings || settings;
    try {
      await putFetcher("/api/configs/general", {
        theme: s.theme,
        language: s.language,
        font_size: s.fontSize,
      });

      if (s.theme) setActiveMode(s.theme);
      if (s.language) setIsLanguage(s.language);
      if (s.fontSize) setIsFontSize(s.fontSize);

      showSnackbar("Đã lưu cài đặt", "success");
    } catch (err) {
      showSnackbar(err.message || "Lỗi khi lưu cài đặt", "error");
    }
  };

  const handleClose = () => {
    onClose();
  };

  const confirmDeleteAllChats = () => {
    setGenericConfirm({
      open: true,
      title: "Xóa tất cả đoạn chat",
      message:
        "Bạn có chắc chắn muốn xóa vĩnh viễn tất cả đoạn chat chưa lưu trữ? Các đoạn đã lưu trữ sẽ không bị ảnh hưởng. Hành động này không thể hoàn tác.",
      confirmColor: "error",
      onConfirm: async () => {
        setGenericConfirm((prev) => ({ ...prev, loading: true }));
        try {
          await deleteFetcher("/api/conversations/delete-all");
          showSnackbar("Đã xóa tất cả đoạn chat chưa lưu trữ", "success");
          if (onRefresh) onRefresh();
          if (onClearChat) onClearChat();
        } catch (err) {
          showSnackbar(err.message || "Lỗi khi xóa", "error");
        } finally {
          setGenericConfirm((prev) => ({ ...prev, loading: false, open: false }));
        }
      },
    });
  };

  const handleArchiveAll = () => {
    setGenericConfirm({
      open: true,
      title: "Lưu trữ tất cả đoạn chat",
      message:
        "Bạn có chắc chắn muốn đánh dấu tất cả đoạn chat hiện tại là đã lưu trữ? Chúng sẽ bị ẩn khỏi danh sách chính.",
      confirmColor: "warning",
      onConfirm: async () => {
        setGenericConfirm((prev) => ({ ...prev, loading: true }));
        try {
          await patchFetcher("/api/conversations/archive-all");
          showSnackbar("Đã lưu trữ tất cả đoạn chat", "success");
          if (onRefresh) onRefresh();
          if (onClearChat) onClearChat();
        } catch (err) {
          showSnackbar(err.message || "Lỗi khi lưu trữ", "error");
        } finally {
          setGenericConfirm((prev) => ({ ...prev, loading: false, open: false }));
        }
      },
    });
  };

  const handleViewArchived = async () => {
    setArchivedDialogOpen(true);
    setLoadingArchived(true);
    try {
      const data = await getFetcher("/api/conversations/archived");
      setArchivedChats(Array.isArray(data) ? data : []);
    } catch (err) {
      showSnackbar(err.message || "Lỗi khi tải danh sách", "error");
    } finally {
      setLoadingArchived(false);
    }
  };

  const handleUnarchive = async (id) => {
    try {
      await patchFetcher(`/api/conversations/${id}/archive`);
      setArchivedChats((prev) => prev.filter((c) => c.id !== id));
      showSnackbar("Đã khôi phục đoạn chat", "success");
      if (onRefresh) onRefresh();
    } catch (err) {
      showSnackbar(err.message || "Lỗi khi khôi phục", "error");
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, minHeight: 420 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pr: 1,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconSettings size={20} />
            Cài đặt
          </Box>
          <IconButton onClick={handleClose} size="small">
            <IconX size={20} />
          </IconButton>
        </DialogTitle>

        <Box sx={{ display: "flex", borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            variant="fullWidth"
            sx={{
              minHeight: 48,
              "& .MuiTab-root": {
                minHeight: 48,
                textTransform: "none",
                fontWeight: 500,
                whiteSpace: "nowrap",
                flexDirection: "row",
                gap: 1,
              },
              "& .MuiTab-iconWrapper": {
                marginBottom: "0 !important",
                marginRight: 0,
              },
            }}
          >
            <Tab icon={<IconPalette size={16} />} iconPosition="start" label="Chung" />
            <Tab icon={<IconDatabase size={16} />} iconPosition="start" label="Dữ liệu" />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 2 }}>
          <TabPanel value={tab} index={0}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                  sx={{
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mb: 1,
                  }}
                >
                  <IconPalette size={13} /> Giao diện
                </Typography>
                <Box sx={{ display: "flex", gap: 0.75 }}>
                  {[
                    { value: "light", label: "Sáng", icon: <IconSun size={15} /> },
                    { value: "dark", label: "Tối", icon: <IconMoon size={15} /> },
                    { value: "system", label: "Hệ thống", icon: <IconDeviceDesktop size={15} /> },
                  ].map((opt) => (
                    <Button
                      key={opt.value}
                      variant={settings.theme === opt.value ? "contained" : "outlined"}
                      size="small"
                      startIcon={opt.icon}
                      onClick={() => setSettings({ ...settings, theme: opt.value })}
                      sx={{ flex: 1, textTransform: "none", fontSize: "0.8rem" }}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                  sx={{
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mb: 1,
                  }}
                >
                  <IconLanguage size={13} /> Ngôn ngữ
                </Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    value={settings.language}
                    onChange={handleChange("language")}
                    sx={{ "& .MuiSelect-select": { py: 0.75 } }}
                  >
                    <MenuItem value="vi" sx={{ fontSize: "0.8rem" }}>
                      Tiếng Việt
                    </MenuItem>
                    <MenuItem value="en" sx={{ fontSize: "0.8rem" }}>
                      English
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Divider />

              <Box>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                  sx={{ textTransform: "uppercase", letterSpacing: 0.5, mb: 1 }}
                >
                  Cỡ chữ
                </Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    value={settings.fontSize}
                    onChange={handleChange("fontSize")}
                    sx={{ "& .MuiSelect-select": { py: 0.75 } }}
                  >
                    <MenuItem value="small" sx={{ fontSize: "0.8rem" }}>
                      Nhỏ
                    </MenuItem>
                    <MenuItem value="medium" sx={{ fontSize: "0.8rem" }}>
                      Vừa
                    </MenuItem>
                    <MenuItem value="large" sx={{ fontSize: "0.8rem" }}>
                      Lớn
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                Quản lý dữ liệu đoạn chat của bạn
              </Typography>

              <List disablePadding>
                <ListItem
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                    mb: 1,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <IconArchive size={18} />
                        Đoạn chat đã lưu trữ
                      </Box>
                    }
                    secondary="Xem danh sách đoạn chat đã lưu trữ"
                  />
                  <ListItemSecondaryAction>
                    <Button size="small" variant="outlined" onClick={handleViewArchived}>
                      Xem
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                    mb: 1,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <IconArchive size={18} />
                        Lưu trữ tất cả đoạn chat
                      </Box>
                    }
                    secondary="Đánh dấu tất cả đoạn chat hiện tại là đã lưu trữ"
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      onClick={handleArchiveAll}
                    >
                      Lưu trữ
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: "error.lighter",
                    "&:hover": { bgcolor: "error.light" },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <IconTrash size={18} />
                        Xóa tất cả đoạn chat
                      </Box>
                    }
                    secondary="Xóa vĩnh viễn tất cả đoạn chat"
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={confirmDeleteAllChats}
                    >
                      Xóa
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </Box>
          </TabPanel>
        </DialogContent>
      </Dialog>

      <DialogMUI
        open={archivedDialogOpen}
        onClose={() => setArchivedDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitleMUI
          sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconArchive size={20} />
            Đoạn chat đã lưu trữ
          </Box>
          <IconButton size="small" onClick={() => setArchivedDialogOpen(false)}>
            <IconX size={18} />
          </IconButton>
        </DialogTitleMUI>
        <DialogContentMUI dividers sx={{ minHeight: 200 }}>
          {loadingArchived ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (archivedChats?.length ?? 0) === 0 ? (
            <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
              Không có đoạn chat nào đã lưu trữ
            </Typography>
          ) : (
            <List disablePadding>
              {archivedChats.map((chat) => (
                <ListItem key={chat.id} divider>
                  <ListItemText
                    primary={chat.title}
                    secondary={new Date(chat.updated_at || chat.created_at).toLocaleDateString(
                      "vi-VN"
                    )}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleUnarchive(chat.id)}
                    >
                      Khôi phục
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContentMUI>
      </DialogMUI>

      <DialogMUI
        open={genericConfirm.open}
        onClose={() =>
          !genericConfirm.loading && setGenericConfirm((p) => ({ ...p, open: false }))
        }
        maxWidth="xs"
        fullWidth
      >
        <DialogTitleMUI sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconBrain
            size={20}
            color={genericConfirm.confirmColor === "error" ? "error" : "primary"}
          />
          {genericConfirm.title}
        </DialogTitleMUI>
        <DialogContentMUI>
          <Typography>{genericConfirm.message}</Typography>
        </DialogContentMUI>
        <DialogActionsMUI>
          <Button
            onClick={() => setGenericConfirm((p) => ({ ...p, open: false }))}
            disabled={genericConfirm.loading}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            color={genericConfirm.confirmColor || "primary"}
            onClick={() => genericConfirm.onConfirm?.()}
            disabled={genericConfirm.loading}
            startIcon={
              genericConfirm.loading ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            Xác nhận
          </Button>
        </DialogActionsMUI>
      </DialogMUI>
    </>
  );
};

export default SettingsDialog;
