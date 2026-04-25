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
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  Dialog as DialogMUI,
  DialogTitle as DialogTitleMUI,
  DialogContent as DialogContentMUI,
  DialogActions as DialogActionsMUI,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import { useState, useContext, useEffect } from "react";
import {
  getFetcher,
  postFetcher,
  putFetcher,
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
  IconPlus,
} from "@tabler/icons-react";
import { AuthContext } from "@/app/context/AuthContext";

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

const SettingsDialog = ({ open, onClose }) => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState(0);
  const [settings, setSettings] = useState({
    theme: theme.palette.mode,
    language: "vi",
    fontSize: "medium",
  });

  // Collections state
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState("default");
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [errorCollections, setErrorCollections] = useState("");

  // Create collection dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const handleCloseSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  // Chat config
  const [chatConfig, setChatConfig] = useState({
    limit: 3,
    use_reranker: true,
    rerank_top_k: 30,
  });

  // Fetch collections and configs on tab change
  useEffect(() => {
    if (open) {
      if (tab === 0) {
        fetchGeneralConfig();
      } else if (tab === 1) {
        fetchCollections();
        fetchChatConfig();
      }
    }
  }, [tab, open]);

  const fetchGeneralConfig = async () => {
    try {
      const data = await getFetcher("/api/configs/general");
      setSettings({
        theme: data.theme || theme.palette.mode,
        language: data.language || "vi",
        fontSize: data.font_size || "medium",
      });
    } catch (err) {
      console.error("Failed to fetch general config:", err);
    }
  };

  const fetchChatConfig = async () => {
    try {
      const data = await getFetcher("/api/configs/chat");
      setChatConfig({
        limit: data.limit || 3,
        use_reranker: data.use_reranker ?? true,
        rerank_top_k: data.rerank_top_k || 30,
      });
      if (data.collection_name) {
        setSelectedCollection(data.collection_name);
      }
    } catch (err) {
      console.error("Failed to fetch chat config:", err);
    }
  };

  const fetchCollections = async () => {
    setLoadingCollections(true);
    setErrorCollections("");
    try {
      const data = await getFetcher("/api/vectors/collections");
      setCollections(data.length > 0 ? data : ["default"]);
      if (!data.includes(selectedCollection) && selectedCollection !== "default") {
        setSelectedCollection("default");
      }
    } catch (err) {
      setErrorCollections(err.message);
      setCollections(["default"]);
    } finally {
      setLoadingCollections(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      setCreateError("Vui lòng nhập tên collection");
      return;
    }

    // Validate name: only letters, numbers, underscore, hyphen
    if (!/^[a-zA-Z0-9_-]+$/.test(newCollectionName)) {
      setCreateError("Tên chỉ chứa chữ cái, số, gạch dưới và gạch ngang");
      return;
    }

    setCreatingCollection(true);
    setCreateError("");
    try {
      await postFetcher("/api/vectors/collections", { name: newCollectionName });

      setCreateSuccess(true);
      setNewCollectionName("");
      setTimeout(() => {
        setCreateSuccess(false);
        setCreateDialogOpen(false);
        fetchCollections();
      }, 1000);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleChange = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setSettings({ ...settings, [field]: value });
  };

  const handleSaveGeneralConfig = async () => {
    try {
      await putFetcher("/api/configs/general", {
        theme: settings.theme,
        language: settings.language,
        font_size: settings.fontSize,
      });
      setSnackbar({ open: true, message: "Lưu cài đặt thành công", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Lỗi khi lưu cài đặt", severity: "error" });
    }
  };

  const handleClose = () => {
    onClose();
  };

  const confirmDeleteAllChats = () => {
    if (window.confirm("Bạn có chắc muốn xóa tất cả đoạn chat? Hành động này không thể hoàn tác.")) {
      localStorage.removeItem("ai_chat_history");
      window.location.reload();
    }
  };

  const handleSaveConfig = async () => {
    try {
      await putFetcher("/api/configs/chat", {
        collection_name: selectedCollection,
        limit: chatConfig.limit,
        rerank_top_k: chatConfig.rerank_top_k,
        use_reranker: chatConfig.use_reranker,
      });
      setSnackbar({ open: true, message: "Lưu cấu hình thành công", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Lỗi khi lưu cấu hình", severity: "error" });
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, minHeight: 480 } }}
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
              minHeight: 44,
              "& .MuiTab-root": { minHeight: 44, textTransform: "none", fontWeight: 500 },
            }}
          >
            <Tab icon={<IconPalette size={16} />} iconPosition="start" label="Chung" />
            <Tab icon={<IconSettings size={16} />} iconPosition="start" label="Cấu hình" />
            <Tab icon={<IconDatabase size={16} />} iconPosition="start" label="Kiểm soát" />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 2 }}>
          {/* TAB 1: Chung */}
          <TabPanel value={tab} index={0}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Giao diện */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <IconPalette size={18} /> Giao diện
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Chế độ hiển thị
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    {[
                      { value: "light", label: "Sáng", icon: <IconSun size={18} /> },
                      { value: "dark", label: "Tối", icon: <IconMoon size={18} /> },
                      { value: "system", label: "Hệ thống", icon: <IconDeviceDesktop size={18} /> },
                    ].map((opt) => (
                      <Button
                        key={opt.value}
                        variant={settings.theme === opt.value ? "contained" : "outlined"}
                        size="small"
                        startIcon={opt.icon}
                        onClick={() => setSettings({ ...settings, theme: opt.value })}
                        sx={{ flex: 1, textTransform: "none" }}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Ngôn ngữ */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <IconLanguage size={18} /> Ngôn ngữ
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Ngôn ngữ giao diện</InputLabel>
                    <Select
                      value={settings.language}
                      label="Ngôn ngữ giao diện"
                      onChange={handleChange("language")}
                    >
                      <MenuItem value="vi">Tiếng Việt</MenuItem>
                      <MenuItem value="en">English</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <Divider />

              {/* Cỡ chữ */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                  Cỡ chữ
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Cỡ chữ</InputLabel>
                    <Select
                      value={settings.fontSize}
                      label="Cỡ chữ"
                      onChange={handleChange("fontSize")}
                    >
                      <MenuItem value="small">Nhỏ</MenuItem>
                      <MenuItem value="medium">Vừa</MenuItem>
                      <MenuItem value="large">Lớn</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <Button variant="contained" sx={{ mt: 1 }} onClick={handleSaveGeneralConfig}>
                Lưu cài đặt
              </Button>
            </Box>
          </TabPanel>

          {/* TAB 2: Cau hinh */}
          <TabPanel value={tab} index={1}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {errorCollections && (
                <Alert severity="error" onClose={() => setErrorCollections("")}>
                  {errorCollections}
                </Alert>
              )}

              {/* Collection selection */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Collection
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<IconPlus size={14} />}
                    onClick={() => setCreateDialogOpen(true)}
                    sx={{ textTransform: "none" }}
                  >
                    Tạo mới
                  </Button>
                </Box>

                {loadingCollections ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <FormControl fullWidth size="small">
                    <InputLabel>Chọn collection</InputLabel>
                    <Select
                      value={selectedCollection}
                      label="Chọn collection"
                      onChange={(e) => setSelectedCollection(e.target.value)}
                    >
                      {collections.map((col) => (
                        <MenuItem key={col} value={col}>
                          {col}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>

              <Divider />

              <Typography variant="subtitle2" fontWeight={600}>
                Tìm kiếm
              </Typography>

              <FormControl fullWidth size="small">
                <InputLabel>Số tài liệu tìm kiếm</InputLabel>
                <Select
                  value={chatConfig.limit}
                  label="Số tài liệu tìm kiếm"
                  onChange={(e) => setChatConfig({ ...chatConfig, limit: e.target.value })}
                >
                  <MenuItem value={1}>1</MenuItem>
                  <MenuItem value={3}>3</MenuItem>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={chatConfig.use_reranker}
                    onChange={(e) => setChatConfig({ ...chatConfig, use_reranker: e.target.checked })}
                  />
                }
                label="Sử dụng Reranker"
              />

              {chatConfig.use_reranker && (
                <FormControl fullWidth size="small">
                  <InputLabel>Số kết quả rerank</InputLabel>
                  <Select
                    value={chatConfig.rerank_top_k}
                    label="Số kết quả rerank"
                    onChange={(e) => setChatConfig({ ...chatConfig, rerank_top_k: e.target.value })}
                  >
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={30}>30</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                  </Select>
                </FormControl>
              )}

              <Button variant="contained" sx={{ mt: 1 }} onClick={handleSaveConfig}>
                Lưu cấu hình
              </Button>
            </Box>
          </TabPanel>

          {/* TAB 3: Kiem soat du lieu */}
          <TabPanel value={tab} index={2}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
                    <Button size="small" variant="outlined">
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

      {/* Create Collection Dialog */}
      <DialogMUI open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitleMUI sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconPlus size={20} />
          Tạo Collection mới
        </DialogTitleMUI>
        <DialogContentMUI>
          {createSuccess ? (
            <Alert severity="success" sx={{ mt: 1 }}>
              Tạo collection thành công!
            </Alert>
          ) : (
            <>
              {createError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {createError}
                </Alert>
              )}
              <TextField
                autoFocus
                fullWidth
                label="Tên collection"
                value={newCollectionName}
                onChange={(e) => {
                  setNewCollectionName(e.target.value);
                  setCreateError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleCreateCollection()}
                placeholder="VD: documents, knowledge_base"
                size="small"
                helperText="Chỉ chứa chữ cái, số, gạch dưới (_) và gạch ngang (-)"
              />
            </>
          )}
        </DialogContentMUI>
        {!createSuccess && (
          <DialogActionsMUI>
            <Button onClick={() => setCreateDialogOpen(false)}>Hủy</Button>
            <Button
              variant="contained"
              onClick={handleCreateCollection}
              disabled={creatingCollection}
              startIcon={creatingCollection ? <CircularProgress size={16} /> : null}
            >
              {creatingCollection ? "Đang tạo..." : "Tạo"}
            </Button>
          </DialogActionsMUI>
        )}
      </DialogMUI>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SettingsDialog;
