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
  Slider,
} from "@mui/material";
import { useState, useContext, useEffect, useRef } from "react";
import {
  getFetcher,
  postFetcher,
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
  IconPlus,
  IconBrain,
} from "@tabler/icons-react";
import { AuthContext } from "@/app/context/AuthContext";
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

const SettingsDialog = ({ open, onClose, onRefresh, onClearChat, onChatConfigChange }) => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const { setActiveMode, setIsLanguage, setIsFontSize } = useContext(CustomizerContext);
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
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDistance, setNewCollectionDistance] = useState("Cosine");
  const [newCollectionVectorSize, setNewCollectionVectorSize] = useState(1024);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [createError, setCreateError] = useState("");
  const [deletingCollection, setDeletingCollection] = useState(false);

  const showSnackbar = useSnackbar();

  // Generic Confirmation Dialog State
  const [genericConfirm, setGenericConfirm] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    loading: false,
    confirmColor: "primary"
  });

  // Archive state
  const [archivedDialogOpen, setArchivedDialogOpen] = useState(false);
  const [archivedChats, setArchivedChats] = useState([]);
  const [loadingArchived, setLoadingArchived] = useState(false);

  // Chat config
  const [chatConfig, setChatConfig] = useState({
    limit: 3,
    use_reranker: true,
    rerank_top_k: 30,
    use_bm25: true,
    bm25_top_k: 30,
    bm25_weight: 0.3,
    reflection_enabled: true,
    reflection_max_history: 20,
    conversation_history_enabled: true,
    conversation_history_max_messages: 10,
    conversation_history_include_system: true,
  });

  // System Prompt state
  const [systemPrompt, setSystemPrompt] = useState("");
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [promptError, setPromptError] = useState("");

  const isInitialGeneral = useRef(true);
  const isInitialChat = useRef(true);

  // Auto-save General Config
  useEffect(() => {
    if (isInitialGeneral.current) {
      isInitialGeneral.current = false;
      return;
    }
    const timer = setTimeout(() => {
      handleSaveGeneralConfig(settings);
    }, 50);
    return () => clearTimeout(timer);
  }, [settings]);

  // Auto-save Chat Config
  useEffect(() => {
    if (isInitialChat.current) {
      isInitialChat.current = false;
      return;
    }
    const timer = setTimeout(() => {
      handleSaveConfig();
    }, 10);
    return () => clearTimeout(timer);
  }, [chatConfig, selectedCollection]);

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
      isInitialGeneral.current = true;
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
      isInitialChat.current = true;
      setChatConfig({
        limit: data.limit || 3,
        use_reranker: data.use_reranker ?? true,
        rerank_top_k: data.rerank_top_k || 30,
        use_bm25: data.use_bm25 ?? true,
        bm25_top_k: data.bm25_top_k || 30,
        bm25_weight: data.bm25_weight ?? 0.3,
        reflection_enabled: data.reflection_enabled ?? true,
        reflection_max_history: data.reflection_max_history || 20,
        conversation_history_enabled: data.conversation_history_enabled ?? true,
        conversation_history_max_messages: data.conversation_history_max_messages || 10,
        conversation_history_include_system: data.conversation_history_include_system ?? true,
      });
      if (data.collection_name) {
        setSelectedCollection(data.collection_name);
      }
      if (data.system_prompt) {
        setSystemPrompt(data.system_prompt);
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
      await postFetcher("/api/vectors/collections", {
        name: newCollectionName,
        vector_size: newCollectionVectorSize,
        distance: newCollectionDistance,
      });

      setCreateDialogOpen(false);
      setNewCollectionName("");
      setNewCollectionDistance("Cosine");
      showSnackbar("Tạo collection thành công", "success");
      fetchCollections();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!collectionToDelete) return;
    setDeletingCollection(true);
    try {
      await deleteFetcher(`/api/vectors/collections/${collectionToDelete}`);
      if (selectedCollection === collectionToDelete) {
        setSelectedCollection(collections.find((c) => c !== collectionToDelete) || "default");
      }
      fetchCollections();
      showSnackbar("Đã xóa collection", "success");
    } catch (err) {
      showSnackbar(err.message || "Lỗi khi xóa collection", "error");
    } finally {
      setDeletingCollection(false);
      setConfirmDialogOpen(false);
      setCollectionToDelete(null);
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

      // Sync with CustomizerContext
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
      message: "Bạn có chắc chắn muốn xóa vĩnh viễn tất cả đoạn chat chưa lưu trữ? Các đoạn đã lưu trữ sẽ không bị ảnh hưởng. Hành động này không thể hoàn tác.",
      confirmColor: "error",
      onConfirm: async () => {
        setGenericConfirm(prev => ({ ...prev, loading: true }));
        try {
          await deleteFetcher("/api/conversations/delete-all");
          showSnackbar("Đã xóa tất cả đoạn chat chưa lưu trữ", "success");
          if (onRefresh) onRefresh();
          if (onClearChat) onClearChat();
        } catch (err) {
          showSnackbar(err.message || "Lỗi khi xóa", "error");
        } finally {
          setGenericConfirm(prev => ({ ...prev, loading: false, open: false }));
        }
      }
    });
  };

  const handleArchiveAll = () => {
    setGenericConfirm({
      open: true,
      title: "Lưu trữ tất cả đoạn chat",
      message: "Bạn có chắc chắn muốn đánh dấu tất cả đoạn chat hiện tại là đã lưu trữ? Chúng sẽ bị ẩn khỏi danh sách chính.",
      confirmColor: "warning",
      onConfirm: async () => {
        setGenericConfirm(prev => ({ ...prev, loading: true }));
        try {
          await patchFetcher("/api/conversations/archive-all");
          showSnackbar("Đã lưu trữ tất cả đoạn chat", "success");
          if (onRefresh) onRefresh();
          if (onClearChat) onClearChat();
        } catch (err) {
          showSnackbar(err.message || "Lỗi khi lưu trữ", "error");
        } finally {
          setGenericConfirm(prev => ({ ...prev, loading: false, open: false }));
        }
      }
    });
  };

  const handleViewArchived = async () => {
    setArchivedDialogOpen(true);
    setLoadingArchived(true);
    try {
      const data = await getFetcher("/api/conversations/archived");
      setArchivedChats(data);
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

  const handleSaveConfig = async () => {
    try {
      await putFetcher("/api/configs/chat", {
        collection_name: selectedCollection,
        limit: chatConfig.limit,
        rerank_top_k: chatConfig.rerank_top_k,
        use_reranker: chatConfig.use_reranker,
        use_bm25: chatConfig.use_bm25,
        bm25_top_k: chatConfig.bm25_top_k,
        bm25_weight: chatConfig.bm25_weight,
        reflection_enabled: chatConfig.reflection_enabled,
        reflection_max_history: chatConfig.reflection_max_history,
        conversation_history_enabled: chatConfig.conversation_history_enabled,
        conversation_history_max_messages: chatConfig.conversation_history_max_messages,
        conversation_history_include_system: chatConfig.conversation_history_include_system,
      });
      if (onChatConfigChange) {
        onChatConfigChange({ ...chatConfig, collection_name: selectedCollection });
      }
      showSnackbar("Đã lưu cấu hình", "success");
    } catch (err) {
      showSnackbar(err.message || "Lỗi khi lưu cấu hình", "error");
    }
  };

  const handleSaveSystemPrompt = async () => {
    if (!systemPrompt.trim()) {
      setPromptError("System prompt không được để trống");
      return;
    }
    if (!systemPrompt.includes("{context}") || !systemPrompt.includes("{query}")) {
      setPromptError("Prompt phải chứa {context} và {query}");
      return;
    }

    setSavingPrompt(true);
    setPromptError("");
    try {
      await putFetcher("/api/configs/chat", {
        system_prompt: systemPrompt,
      });
      setEditingPrompt(false);
      if (onChatConfigChange) {
        onChatConfigChange({ ...chatConfig, collection_name: selectedCollection, system_prompt: systemPrompt });
      }
      showSnackbar("Đã lưu system prompt", "success");
    } catch (err) {
      setPromptError(err.message || "Lỗi khi lưu system prompt");
    } finally {
      setSavingPrompt(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {/* Giao diện */}
              <Box>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
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

              {/* Ngôn ngữ */}
              <Box>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                  <IconLanguage size={13} /> Ngôn ngữ
                </Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    value={settings.language}
                    onChange={handleChange("language")}
                    sx={{ "& .MuiSelect-select": { py: 0.75 } }}
                  >
                    <MenuItem value="vi" sx={{ fontSize: "0.8rem" }}>Tiếng Việt</MenuItem>
                    <MenuItem value="en" sx={{ fontSize: "0.8rem" }}>English</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Divider />

              {/* Cỡ chữ */}
              <Box>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, mb: 1 }}>
                  Cỡ chữ
                </Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    value={settings.fontSize}
                    onChange={handleChange("fontSize")}
                    sx={{ "& .MuiSelect-select": { py: 0.75 } }}
                  >
                    <MenuItem value="small" sx={{ fontSize: "0.8rem" }}>Nhỏ</MenuItem>
                    <MenuItem value="medium" sx={{ fontSize: "0.8rem" }}>Vừa</MenuItem>
                    <MenuItem value="large" sx={{ fontSize: "0.8rem" }}>Lớn</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </TabPanel>

          {/* TAB 2: Cau hinh */}
          <TabPanel value={tab} index={1}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {errorCollections && (
                <Alert severity="error" onClose={() => setErrorCollections("")} sx={{ py: 0.5 }}>
                  {errorCollections}
                </Alert>
              )}

              {/* Collection selection */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Collection
                  </Typography>
                </Box>

                {loadingCollections ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
                    <FormControl size="small" sx={{ flex: 1 }}>
                      <Select
                        value={selectedCollection}
                        renderValue={(v) => <Typography variant="body2">{v}</Typography>}
                        onChange={(e) => setSelectedCollection(e.target.value)}
                        sx={{ "& .MuiSelect-select": { py: 0.75 } }}
                      >
                        {collections.map((col) => (
                          <MenuItem key={col} value={col}>
                            {col}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<IconPlus size={13} />}
                      onClick={() => setCreateDialogOpen(true)}
                      sx={{ textTransform: "none", flexShrink: 0, px: 1, py: 0.5, fontSize: "0.75rem" }}
                    >
                      Tạo mới
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        setCollectionToDelete(selectedCollection);
                        setConfirmDialogOpen(true);
                      }}
                      disabled={deletingCollection}
                      startIcon={deletingCollection ? <CircularProgress size={12} /> : <IconTrash size={13} />}
                      sx={{ whiteSpace: "nowrap", flexShrink: 0, px: 1, py: 0.5, fontSize: "0.75rem" }}
                    >
                      Xóa
                    </Button>
                  </Box>
                )}
              </Box>

              <Divider />

              {/* Tìm kiếm */}
              <Box>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                  Tìm kiếm
                </Typography>

                {/* Số tài liệu */}
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 70 }}>
                    Số tài liệu
                  </Typography>
                  <Slider
                    size="small"
                    value={chatConfig.limit}
                    min={1}
                    max={10}
                    step={1}
                    onChange={(_, v) => setChatConfig({ ...chatConfig, limit: v })}
                    sx={{ flex: 1, minWidth: 120 }}
                  />
                  <Typography variant="body2" sx={{ minWidth: 24, textAlign: "right", fontWeight: 600 }}>
                    {chatConfig.limit}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* BM25 */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                    BM25
                  </Typography>
                  <Switch
                    size="small"
                    checked={chatConfig.use_bm25}
                    onChange={(e) => setChatConfig({ ...chatConfig, use_bm25: e.target.checked })}
                  />
                </Box>
                {chatConfig.use_bm25 && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 70 }}>
                        Top BM25
                      </Typography>
                      <Slider
                        size="small"
                        value={chatConfig.bm25_top_k}
                        min={5}
                        max={chatConfig.use_reranker ? chatConfig.rerank_top_k : 50}
                        step={5}
                        onChange={(_, v) => setChatConfig({ ...chatConfig, bm25_top_k: v })}
                        sx={{ flex: 1, minWidth: 120 }}
                      />
                      <Typography variant="body2" sx={{ minWidth: 24, textAlign: "right", fontWeight: 600 }}>
                        {chatConfig.bm25_top_k}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 70 }}>
                        Weight
                      </Typography>
                      <Slider
                        size="small"
                        value={Math.round(chatConfig.bm25_weight * 100)}
                        min={10}
                        max={90}
                        step={1}
                        onChange={(_, v) => setChatConfig({ ...chatConfig, bm25_weight: v / 100 })}
                        sx={{ flex: 1, minWidth: 120 }}
                      />
                      <Typography variant="body2" sx={{ minWidth: 32, textAlign: "right", fontWeight: 600 }}>
                        {Math.round(chatConfig.bm25_weight * 100)}%
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Divider sx={{ my: 1 }} />

                {/* Reranker */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Reranker
                  </Typography>
                  <Switch
                    size="small"
                    checked={chatConfig.use_reranker}
                    onChange={(e) => setChatConfig({ ...chatConfig, use_reranker: e.target.checked })}
                  />
                </Box>
                {chatConfig.use_reranker && (
                  <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 70 }}>
                      Top K
                    </Typography>
                    <Slider
                      size="small"
                      value={chatConfig.rerank_top_k}
                      min={10}
                      max={50}
                      step={5}
                      onChange={(_, v) => setChatConfig({ ...chatConfig, rerank_top_k: v })}
                      sx={{ flex: 1, minWidth: 120 }}
                    />
                    <Typography variant="body2" sx={{ minWidth: 24, textAlign: "right", fontWeight: 600 }}>
                      {chatConfig.rerank_top_k}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider />

              {/* Hội thoại */}
              <Box>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}>
                  Hội thoại
                </Typography>

                {/* Reflection */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>Reflection</Typography>
                    <Typography variant="caption" color="text.secondary">Viết lại câu hỏi mơ hồ dựa trên lịch sử chat</Typography>
                  </Box>
                  <Switch
                    size="small"
                    checked={chatConfig.reflection_enabled}
                    onChange={(e) => setChatConfig({ ...chatConfig, reflection_enabled: e.target.checked })}
                  />
                </Box>
                {chatConfig.reflection_enabled && (
                  <Box sx={{ pl: 0.5, mb: 1 }}>
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                        Số tin nhắn gần nhất
                      </Typography>
                      <Slider
                        size="small"
                        value={chatConfig.reflection_max_history}
                        min={1}
                        max={50}
                        step={1}
                        onChange={(_, v) => setChatConfig({ ...chatConfig, reflection_max_history: v })}
                        sx={{ flex: 1, minWidth: 120 }}
                      />
                      <Typography variant="body2" sx={{ minWidth: 28, textAlign: "right", fontWeight: 600 }}>
                        {chatConfig.reflection_max_history}
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Divider sx={{ my: 1 }} />

                {/* Lịch sử hội thoại */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>Lịch sử hội thoại</Typography>
                    <Typography variant="caption" color="text.secondary">Đưa tin nhắn cũ vào LLM để duy trì ngữ cảnh</Typography>
                  </Box>
                  <Switch
                    size="small"
                    checked={chatConfig.conversation_history_enabled}
                    onChange={(e) =>
                      setChatConfig({
                        ...chatConfig,
                        conversation_history_enabled: e.target.checked,
                        conversation_history_max_messages: e.target.checked && chatConfig.conversation_history_max_messages === 0 ? 10 : chatConfig.conversation_history_max_messages,
                      })
                    }
                  />
                </Box>
                {chatConfig.conversation_history_enabled && (
                  <>
                    <Box sx={{ pl: 0.5, mb: 1 }}>
                      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                          Số tin nhắn gần nhất
                        </Typography>
                        <Slider
                          size="small"
                          value={chatConfig.conversation_history_max_messages}
                          min={1}
                          max={20}
                          step={1}
                          onChange={(_, v) =>
                            setChatConfig({ ...chatConfig, conversation_history_max_messages: v })
                          }
                          sx={{ flex: 1, minWidth: 120 }}
                        />
                        <Typography variant="body2" sx={{ minWidth: 28, textAlign: "right", fontWeight: 600 }}>
                          {chatConfig.conversation_history_max_messages}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>Context mỗi tin nhắn</Typography>
                        <Typography variant="caption" color="text.secondary">Đưa system prompt vào mỗi turn</Typography>
                      </Box>
                      <Switch
                        size="small"
                        checked={chatConfig.conversation_history_include_system}
                        onChange={(e) =>
                          setChatConfig({ ...chatConfig, conversation_history_include_system: e.target.checked })
                        }
                      />
                    </Box>
                  </>
                )}
              </Box>

              <Divider />

              {/* System Prompt */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconBrain size={13} />
                    System Prompt
                  </Typography>
                  {!editingPrompt ? (
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setEditingPrompt(true)}
                      sx={{ textTransform: "none", fontSize: "0.75rem", p: 0.25 }}
                    >
                      Chỉnh sửa
                    </Button>
                  ) : (
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Button
                        size="small"
                        onClick={() => { setEditingPrompt(false); setPromptError(""); fetchChatConfig(); }}
                        sx={{ textTransform: "none", fontSize: "0.75rem", p: 0.5 }}
                      >
                        Hủy
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleSaveSystemPrompt}
                        disabled={savingPrompt}
                        startIcon={savingPrompt ? <CircularProgress size={12} color="inherit" /> : null}
                        sx={{ textTransform: "none", fontSize: "0.75rem", p: 0.5 }}
                      >
                        Lưu
                      </Button>
                    </Box>
                  )}
                </Box>

                {promptError && <Alert severity="error" sx={{ py: 0.5, mb: 0.5 }}>{promptError}</Alert>}

                {editingPrompt ? (
                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    value={systemPrompt}
                    onChange={(e) => { setSystemPrompt(e.target.value); setPromptError(""); }}
                    placeholder="Nhập system prompt..."
                    sx={{
                      "& .MuiInputBase-root": { fontFamily: "monospace", fontSize: "0.8rem" },
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      p: 1.25,
                      bgcolor: "grey.100",
                      borderRadius: 1,
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      whiteSpace: "pre-wrap",
                      maxHeight: 120,
                      overflow: "auto",
                      border: 1,
                      borderColor: "divider",
                      ...(theme.palette.mode === "dark" && { bgcolor: "grey.900", color: "grey.300" }),
                    }}
                  >
                    {systemPrompt || "Chưa có system prompt"}
                  </Box>
                )}
              </Box>
            </Box>
          </TabPanel>

          {/* TAB 3: Kiem soat du lieu */}
          <TabPanel value={tab} index={2}>
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

      {/* Create Collection Dialog */}
      <DialogMUI open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitleMUI sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconPlus size={20} />
          Tạo Collection mới
        </DialogTitleMUI>
        <DialogContentMUI sx={{ height: "100%" }}>
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
            sx={{ mb: 2, marginTop: "10px" }}
          />
          <TextField
            fullWidth
            label="Vector size"
            type="number"
            value={newCollectionVectorSize}
            onChange={(e) => setNewCollectionVectorSize(Number(e.target.value))}
            size="small"
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Distance</InputLabel>
            <Select
              value={newCollectionDistance}
              label="Distance"
              onChange={(e) => setNewCollectionDistance(e.target.value)}
            >
              <MenuItem value="Cosine">Cosine</MenuItem>
              <MenuItem value="Euclid">Euclid</MenuItem>
              <MenuItem value="Dot">Dot</MenuItem>
            </Select>
          </FormControl>
        </DialogContentMUI>
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
      </DialogMUI>

      {/* Delete Collection Confirm Dialog */}
      <DialogMUI open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitleMUI sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconTrash size={20} color="error" />
          Xác nhận xóa Collection
        </DialogTitleMUI>
        <DialogContentMUI>
          <Typography>
            Bạn có chắc muốn xóa collection <strong>"{collectionToDelete}"</strong> không? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContentMUI>
        <DialogActionsMUI>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={deletingCollection}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteCollection}
            disabled={deletingCollection}
            startIcon={deletingCollection ? <CircularProgress size={16} color="inherit" /> : <IconTrash size={16} />}
          >
            {deletingCollection ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogActionsMUI>
      </DialogMUI>

      {/* Archived Chats Dialog */}
      <DialogMUI
        open={archivedDialogOpen}
        onClose={() => setArchivedDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitleMUI sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
          ) : archivedChats.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
              Không có đoạn chat nào đã lưu trữ
            </Typography>
          ) : (
            <List disablePadding>
              {archivedChats.map((chat) => (
                <ListItem key={chat.id} divider>
                  <ListItemText
                    primary={chat.title}
                    secondary={new Date(chat.updated_at || chat.created_at).toLocaleDateString("vi-VN")}
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

      {/* Generic Confirmation Dialog */}
      <DialogMUI
        open={genericConfirm.open}
        onClose={() => !genericConfirm.loading && setGenericConfirm(p => ({ ...p, open: false }))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitleMUI sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconBrain size={20} color={genericConfirm.confirmColor === "error" ? "error" : "primary"} />
          {genericConfirm.title}
        </DialogTitleMUI>
        <DialogContentMUI>
          <Typography>
            {genericConfirm.message}
          </Typography>
        </DialogContentMUI>
        <DialogActionsMUI>
          <Button
            onClick={() => setGenericConfirm(p => ({ ...p, open: false }))}
            disabled={genericConfirm.loading}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            color={genericConfirm.confirmColor}
            onClick={genericConfirm.onConfirm}
            disabled={genericConfirm.loading}
            startIcon={genericConfirm.loading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {genericConfirm.loading ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </DialogActionsMUI>
      </DialogMUI>

    </>
  );
};

export default SettingsDialog;

