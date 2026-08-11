"use client";

import {
  Box,
  Typography,
  Switch,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Slider,
  Paper,
  Stack,
  Chip,
  Grid,
} from "@mui/material";
import { useState, useEffect, useRef } from "react";
import {
  getFetcher,
  postFetcher,
  putFetcher,
  deleteFetcher,
} from "@/app/api/globalFetcher";
import { useTheme, alpha } from "@mui/material/styles";
import {
  IconPlus,
  IconTrash,
  IconBrain,
  IconDatabase,
  IconSearch,
  IconMessageCircle,
  IconEdit,
} from "@tabler/icons-react";
import { useSnackbar } from "@/app/context/SnackbarContext";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";

function SectionCard({ icon: Icon, title, description, action, children }) {
  const theme = useTheme();
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderBottom: children != null && children !== false ? 1 : 0,
          borderColor: "divider",
          bgcolor: alpha(theme.palette.primary.main, 0.04),
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: "primary.main",
            flexShrink: 0,
          }}
        >
          <Icon size={18} stroke={1.75} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.3}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {description}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      {children != null && children !== false && <Box sx={{ p: 2.5 }}>{children}</Box>}
    </Paper>
  );
}

function SliderRow({ label, value, display, min, max, step, disabled, onChange }) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Chip
          size="small"
          label={display ?? value}
          sx={{
            height: 22,
            fontWeight: 700,
            fontSize: "0.75rem",
            bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
            color: "primary.main",
          }}
        />
      </Stack>
      <Slider
        size="small"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(_, v) => onChange(v)}
        valueLabelDisplay="auto"
      />
    </Box>
  );
}

function FeatureToggle({ title, description, checked, disabled, onChange, children }) {
  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: 2,
        border: 1,
        borderColor: "divider",
        bgcolor: checked
          ? (t) => alpha(t.palette.primary.main, 0.03)
          : "transparent",
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600}>
            {title}
          </Typography>
          {description && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
              {description}
            </Typography>
          )}
        </Box>
        <Switch
          size="small"
          disabled={disabled}
          checked={checked}
          onChange={onChange}
          sx={{ mt: -0.5 }}
        />
      </Stack>
      {checked && children && (
        <Box sx={{ mt: 1.75, pt: 1.75, borderTop: 1, borderColor: "divider" }}>{children}</Box>
      )}
    </Box>
  );
}

export default function ChatConfigPanel({ onConfigChange }) {
  const theme = useTheme();
  const showSnackbar = useSnackbar();
  const canUpdate = useHasPermission("config", "update");

  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState("default");
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [errorCollections, setErrorCollections] = useState("");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDistance, setNewCollectionDistance] = useState("Cosine");
  const [newCollectionVectorSize, setNewCollectionVectorSize] = useState(1024);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [createError, setCreateError] = useState("");
  const [deletingCollection, setDeletingCollection] = useState(false);

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

  const [systemPrompt, setSystemPrompt] = useState("");
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [promptError, setPromptError] = useState("");
  const [loading, setLoading] = useState(true);

  const skipAutosave = useRef(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      skipAutosave.current = true;
      await Promise.all([fetchCollections(), fetchChatConfig()]);
      setLoading(false);
      setTimeout(() => {
        skipAutosave.current = false;
      }, 500);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (skipAutosave.current || !canUpdate) return;
    const timer = setTimeout(() => {
      handleSaveConfig();
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatConfig, selectedCollection]);

  const fetchChatConfig = async () => {
    try {
      const data = await getFetcher("/api/configs/chat");
      if (!data || typeof data !== "object") return;
      setChatConfig({
        limit: Number(data.limit) > 0 ? Number(data.limit) : 3,
        use_reranker: data.use_reranker ?? true,
        rerank_top_k: Number(data.rerank_top_k) > 0 ? Number(data.rerank_top_k) : 30,
        use_bm25: data.use_bm25 ?? true,
        bm25_top_k: Number(data.bm25_top_k) > 0 ? Number(data.bm25_top_k) : 30,
        bm25_weight:
          data.bm25_weight == null || Number.isNaN(Number(data.bm25_weight))
            ? 0.3
            : Number(data.bm25_weight),
        reflection_enabled: data.reflection_enabled ?? true,
        reflection_max_history:
          Number(data.reflection_max_history) > 0
            ? Number(data.reflection_max_history)
            : 20,
        conversation_history_enabled: data.conversation_history_enabled ?? true,
        conversation_history_max_messages:
          Number(data.conversation_history_max_messages) > 0
            ? Number(data.conversation_history_max_messages)
            : 10,
        conversation_history_include_system:
          data.conversation_history_include_system ?? true,
      });
      if (data.collection_name) {
        setSelectedCollection(data.collection_name);
      }
      if (data.system_prompt) {
        setSystemPrompt(data.system_prompt);
      }
    } catch (err) {
      console.error("Failed to fetch chat config:", err);
      showSnackbar(err?.message || "Không tải được cấu hình chat", "error");
    }
  };

  const fetchCollections = async () => {
    setLoadingCollections(true);
    setErrorCollections("");
    try {
      const data = await getFetcher("/api/vectors/collections");
      const list = Array.isArray(data) ? data.filter(Boolean) : [];
      const next = list.length > 0 ? list : ["default"];
      setCollections(next);
      setSelectedCollection((prev) => (next.includes(prev) ? prev : next[0] || "default"));
    } catch (err) {
      setErrorCollections(err?.message || "Không tải được collections");
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
        setSelectedCollection(
          collections.find((c) => c !== collectionToDelete) || "default"
        );
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
      if (onConfigChange) {
        onConfigChange({ ...chatConfig, collection_name: selectedCollection });
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
      if (onConfigChange) {
        onConfigChange({
          ...chatConfig,
          collection_name: selectedCollection,
          system_prompt: systemPrompt,
        });
      }
      showSnackbar("Đã lưu system prompt", "success");
    } catch (err) {
      setPromptError(err.message || "Lỗi khi lưu system prompt");
    } finally {
      setSavingPrompt(false);
    }
  };

  const updateConfig = (patch) => {
    if (!canUpdate) return;
    setChatConfig((prev) => ({ ...prev, ...patch }));
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Stack spacing={2.5}>
        {!canUpdate && (
          <Alert severity="info">
            Bạn chỉ có quyền xem. Cần quyền <strong>config.update</strong> để chỉnh sửa.
          </Alert>
        )}

        {errorCollections && (
          <Alert severity="error" onClose={() => setErrorCollections("")}>
            {errorCollections}
          </Alert>
        )}

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12 }}>
            <SectionCard
              icon={IconDatabase}
              title="Collection"
              description="Kho vector dùng cho truy vấn RAG"
              action={
                loadingCollections ? (
                  <CircularProgress size={22} />
                ) : (
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexShrink={0}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <FormControl size="small" sx={{ minWidth: 180, width: { xs: "100%", sm: 220 } }} disabled={!canUpdate}>
                      <InputLabel>Collection đang dùng</InputLabel>
                      <Select
                        label="Collection đang dùng"
                        value={
                          collections.includes(selectedCollection)
                            ? selectedCollection
                            : collections[0] || ""
                        }
                        onChange={(e) => canUpdate && setSelectedCollection(e.target.value)}
                      >
                        {collections.map((col) => (
                          <MenuItem key={col} value={col}>
                            {col}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {canUpdate && (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<IconPlus size={15} />}
                          onClick={() => setCreateDialogOpen(true)}
                          sx={{ textTransform: "none" }}
                        >
                          Tạo mới
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={
                            deletingCollection ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : (
                              <IconTrash size={15} />
                            )
                          }
                          onClick={() => {
                            setCollectionToDelete(selectedCollection);
                            setConfirmDialogOpen(true);
                          }}
                          disabled={deletingCollection || !selectedCollection}
                          sx={{ textTransform: "none" }}
                        >
                          Xóa
                        </Button>
                      </>
                    )}
                  </Stack>
                )
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <SectionCard
              icon={IconSearch}
              title="Tìm kiếm RAG"
              description="Số tài liệu, BM25 và reranker"
            >
              <Stack spacing={2.5}>
                <SliderRow
                  label="Số tài liệu đưa vào context"
                  value={Number(chatConfig.limit) || 1}
                  min={1}
                  max={10}
                  step={1}
                  disabled={!canUpdate}
                  onChange={(v) => updateConfig({ limit: v })}
                />

                <FeatureToggle
                  title="BM25"
                  description="Kết hợp tìm kiếm từ khóa với semantic search"
                  checked={Boolean(chatConfig.use_bm25)}
                  disabled={!canUpdate}
                  onChange={(e) => updateConfig({ use_bm25: e.target.checked })}
                >
                  <Stack spacing={2}>
                    <SliderRow
                      label="Top BM25"
                      value={Number(chatConfig.bm25_top_k) || 5}
                      min={5}
                      max={chatConfig.use_reranker ? Number(chatConfig.rerank_top_k) || 50 : 50}
                      step={5}
                      disabled={!canUpdate}
                      onChange={(v) => updateConfig({ bm25_top_k: v })}
                    />
                    <SliderRow
                      label="Trọng số BM25"
                      value={Math.round((Number(chatConfig.bm25_weight) || 0.3) * 100)}
                      display={`${Math.round((Number(chatConfig.bm25_weight) || 0.3) * 100)}%`}
                      min={10}
                      max={90}
                      step={1}
                      disabled={!canUpdate}
                      onChange={(v) => updateConfig({ bm25_weight: v / 100 })}
                    />
                  </Stack>
                </FeatureToggle>

                <FeatureToggle
                  title="Reranker"
                  description="Xếp hạng lại kết quả trước khi đưa vào LLM"
                  checked={Boolean(chatConfig.use_reranker)}
                  disabled={!canUpdate}
                  onChange={(e) => updateConfig({ use_reranker: e.target.checked })}
                >
                  <SliderRow
                    label="Top K rerank"
                    value={Number(chatConfig.rerank_top_k) || 10}
                    min={10}
                    max={50}
                    step={5}
                    disabled={!canUpdate}
                    onChange={(v) => updateConfig({ rerank_top_k: v })}
                  />
                </FeatureToggle>
              </Stack>
            </SectionCard>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <SectionCard
              icon={IconMessageCircle}
              title="Hội thoại"
              description="Reflection và ngữ cảnh lịch sử"
            >
              <Stack spacing={2}>
                <FeatureToggle
                  title="Reflection"
                  description="Viết lại câu hỏi mơ hồ dựa trên lịch sử chat"
                  checked={Boolean(chatConfig.reflection_enabled)}
                  disabled={!canUpdate}
                  onChange={(e) => updateConfig({ reflection_enabled: e.target.checked })}
                >
                  <SliderRow
                    label="Số tin nhắn gần nhất"
                    value={Number(chatConfig.reflection_max_history) || 1}
                    min={1}
                    max={50}
                    step={1}
                    disabled={!canUpdate}
                    onChange={(v) => updateConfig({ reflection_max_history: v })}
                  />
                </FeatureToggle>

                <FeatureToggle
                  title="Lịch sử hội thoại"
                  description="Đưa tin nhắn cũ vào LLM để duy trì ngữ cảnh"
                  checked={Boolean(chatConfig.conversation_history_enabled)}
                  disabled={!canUpdate}
                  onChange={(e) =>
                    updateConfig({
                      conversation_history_enabled: e.target.checked,
                      conversation_history_max_messages:
                        e.target.checked && chatConfig.conversation_history_max_messages === 0
                          ? 10
                          : chatConfig.conversation_history_max_messages,
                    })
                  }
                >
                  <Stack spacing={2}>
                    <SliderRow
                      label="Số tin nhắn gần nhất"
                      value={Number(chatConfig.conversation_history_max_messages) || 1}
                      min={1}
                      max={20}
                      step={1}
                      disabled={!canUpdate}
                      onChange={(v) => updateConfig({ conversation_history_max_messages: v })}
                    />
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      gap={2}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Context mỗi tin nhắn
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Đưa system prompt vào mỗi turn
                        </Typography>
                      </Box>
                      <Switch
                        size="small"
                        disabled={!canUpdate}
                        checked={Boolean(chatConfig.conversation_history_include_system)}
                        onChange={(e) =>
                          updateConfig({
                            conversation_history_include_system: e.target.checked,
                          })
                        }
                      />
                    </Stack>
                  </Stack>
                </FeatureToggle>
              </Stack>
            </SectionCard>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <SectionCard
              icon={IconBrain}
              title="System prompt"
              description="Phải chứa {context} và {query}"
              action={
                canUpdate &&
                (!editingPrompt ? (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<IconEdit size={14} />}
                    onClick={() => setEditingPrompt(true)}
                    sx={{ textTransform: "none", flexShrink: 0 }}
                  >
                    Chỉnh sửa
                  </Button>
                ) : (
                  <Stack direction="row" spacing={1} flexShrink={0}>
                    <Button
                      size="small"
                      onClick={() => {
                        setEditingPrompt(false);
                        setPromptError("");
                        fetchChatConfig();
                      }}
                      sx={{ textTransform: "none" }}
                    >
                      Hủy
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleSaveSystemPrompt}
                      disabled={savingPrompt}
                      startIcon={
                        savingPrompt ? <CircularProgress size={12} color="inherit" /> : null
                      }
                      sx={{ textTransform: "none" }}
                    >
                      Lưu
                    </Button>
                  </Stack>
                ))
              }
            >
              {promptError && (
                <Alert severity="error" sx={{ mb: 1.5 }}>
                  {promptError}
                </Alert>
              )}

              {editingPrompt ? (
                <TextField
                  multiline
                  minRows={10}
                  fullWidth
                  value={systemPrompt}
                  onChange={(e) => {
                    setSystemPrompt(e.target.value);
                    setPromptError("");
                  }}
                  placeholder="Nhập system prompt..."
                  sx={{
                    "& .MuiInputBase-root": {
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      fontSize: "0.8125rem",
                      lineHeight: 1.6,
                    },
                  }}
                />
              ) : (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontSize: "0.8125rem",
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                    maxHeight: 360,
                    overflow: "auto",
                    border: 1,
                    borderColor: "divider",
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? alpha(theme.palette.common.white, 0.03)
                        : alpha(theme.palette.common.black, 0.02),
                    color: "text.secondary",
                  }}
                >
                  {systemPrompt || "Chưa có system prompt"}
                </Box>
              )}
            </SectionCard>
          </Grid>
        </Grid>
      </Stack>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconPlus size={20} />
          Tạo Collection mới
        </DialogTitle>
        <DialogContent>
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
            sx={{ mb: 2, mt: 1 }}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleCreateCollection}
            disabled={creatingCollection}
            startIcon={creatingCollection ? <CircularProgress size={16} /> : null}
          >
            {creatingCollection ? "Đang tạo..." : "Tạo"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconTrash size={20} color="error" />
          Xác nhận xóa Collection
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc muốn xóa collection <strong>&quot;{collectionToDelete}&quot;</strong> không?
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={deletingCollection}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteCollection}
            disabled={deletingCollection}
            startIcon={
              deletingCollection ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <IconTrash size={16} />
              )
            }
          >
            {deletingCollection ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
