"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Box,
  IconButton,
  InputBase,
  Typography,
  Tooltip,
  Snackbar,
  Alert,
  Chip,
  CircularProgress,
  Fade,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Menu,
  MenuItem,
  Paper,
  Slider,
  Switch,
  FormControlLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  IconSearch,
  IconPlus,
  IconTrash,
  IconPlayerStop,
  IconSend,
  IconSparkles,
  IconCopy,
  IconArrowBackUp,
  IconSettings,
  IconX,
  IconCheck,
  IconMenu2,
  IconLogout,
  IconUser,
  IconKey,
  IconRefresh,
} from "@tabler/icons-react";
import { useAuth } from "@/app/context/AuthContext";
import { getFetcher, deleteFetcher } from "@/app/api/globalFetcher";
import ProfileDialog from "@/app/components/user/ProfileDialog";
import SettingsDialog from "@/app/components/user/SettingsDialog";

const SIDEBAR_WIDTH = 300;
const COLLAPSED_SIDEBAR_WIDTH = 48;

const normalizeAssistantText = (text) => {
  if (!text) return "";
  return text.replace(/^"+|"+$/g, "");
};

const SimpleChatApp = () => {
  const theme = useTheme();
  const { getAccessToken, user, logout } = useAuth();
  const [input, setInput] = useState("");
  const [savedInput, setSavedInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [contextSources, setContextSources] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorSnackbar, setErrorSnackbar] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [userAnchor, setUserAnchor] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null });

  const handleChatConfigChange = (newConfig) => {
    setChatConfig(newConfig);
  };

  const [chatConfig, setChatConfig] = useState({
    collection_name: null,
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
  const [configLoaded, setConfigLoaded] = useState(false);

  const bottomRef = useRef(null);
  const abortRef = useRef(null);
  const inputRef = useRef(null);
  const isStreamingRef = useRef(false);
  const syncingFromHistoryRef = useRef(false);

  const isDark = theme.palette.mode === "dark";

  // Fetch chat history from backend
  const fetchHistory = useCallback(async () => {
    const token = getAccessToken?.();
    if (!token) return;

    try {
      const history = await getFetcher("/api/conversations");
      const formatted = history
        .map((conv) => ({
          id: conv.id,
          title: conv.title,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
        }))
        .sort((a, b) => {
          const ta = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
          const tb = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
          return tb - ta; // mới nhất lên trên
        });
      setChatHistory(formatted);
    } catch (err) {
      console.error("Failed to fetch chat history", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Reload chat history when settings dialog closes (e.g. after archive/unarchive)
  useEffect(() => {
    if (!settingsOpen) {
      fetchHistory();
    }
  }, [settingsOpen, fetchHistory]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await getFetcher("/api/configs/chat");
        setChatConfig({
          collection_name: config.collection_name || null,
          limit: config.limit || 3,
          use_reranker: config.use_reranker ?? true,
          rerank_top_k: config.rerank_top_k || 30,
          use_bm25: config.use_bm25 ?? true,
          bm25_top_k: config.bm25_top_k || 30,
          bm25_weight: config.bm25_weight ?? 0.3,
          reflection_enabled: config.reflection_enabled ?? true,
          reflection_max_history: config.reflection_max_history || 20,
          conversation_history_enabled: config.conversation_history_enabled ?? true,
          conversation_history_max_messages: config.conversation_history_max_messages || 10,
          conversation_history_include_system: config.conversation_history_include_system ?? true,
        });
      } catch (err) {
        console.error("Failed to fetch chat config", err);
      } finally {
        setConfigLoaded(true);
      }
    };
    fetchConfig();
  }, []);

  // Load messages when selecting a conversation
  const fetchMessages = useCallback(
    async (conversationId) => {
      const token = getAccessToken?.();
      if (!token || conversationId <= 0) return;

      try {
        const conv = await getFetcher(`/api/conversations/${conversationId}`);
        const formattedMessages = conv.messages.map((msg) => ({
          id: String(msg.id),
          role: msg.role,
          content: msg.content || "",
          status: "done",
        }));
        setMessages(formattedMessages);
        // Set context sources from last assistant message
        const lastAssistant = [...formattedMessages]
          .reverse()
          .find((m) => m.role === "assistant");
        if (lastAssistant?.context_sources !== undefined) {
          setContextSources(lastAssistant.context_sources || 0);
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    },
    [getAccessToken],
  );

  // Sync messages when activeChatId changes (only when not streaming)
  useEffect(() => {
    if (activeChatId && activeChatId > 0 && !isStreamingRef.current) {
      fetchMessages(activeChatId);
    } else if (!activeChatId) {
      setMessages([]);
    }
  }, [activeChatId, fetchMessages]);

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return chatHistory;
    return chatHistory.filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [chatHistory, searchQuery]);

  const canSend = useMemo(
    () => !isStreaming && input.trim().length > 0 && configLoaded,
    [input, isStreaming, configLoaded],
  );

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (messages.length > 0 || isStreaming) {
      scrollToBottom();
    }
  }, [messages, isStreaming, scrollToBottom]);

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt) return;

    const token = getAccessToken?.();
    if (!token) {
      setErrorMessage("Vui long dang nhap de su dung AI Assistant.");
      setErrorSnackbar(true);
      return;
    }

    if (!chatConfig.collection_name) {
      setErrorMessage("Collections chưa được setup");
      setErrorSnackbar(true);
      return;
    }

    setSavedInput(input);
    setInput("");
    setIsStreaming(true);
    isStreamingRef.current = true;
    setErrorMessage("");

    const isNewChat = !activeChatId;
    const userMessageId = `temp-user-${Date.now()}`;
    const assistantId = `temp-assistant-${Date.now()}`;

    const userMessage = {
      id: userMessageId,
      role: "user",
      content: prompt,
      status: "done",
    };
    const assistantMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      status: "streaming",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      let endpoint, body;

      if (isNewChat) {
        // Create new conversation with message
        endpoint = "/api/conversations";
        body = {
          title: prompt.substring(0, 40),
          query: prompt,
          ...chatConfig,
        };
      } else {
        // Add message to existing conversation
        endpoint = `/api/conversations/${activeChatId}/messages`;
        body = {
          query: prompt,
          ...chatConfig,
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const conversationIdHeader = response.headers.get("X-Conversation-Id");
      const sourcesHeader = response.headers.get("X-Context-Sources");

      if (isNewChat && conversationIdHeader) {
        const newId = parseInt(conversationIdHeader, 10);
        // Update local chat list
        setChatHistory((prev) => [
          {
            id: newId,
            title: prompt.substring(0, 40),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setActiveChatId(newId);
      }

      setContextSources(parseInt(sourcesHeader || "0", 10));

      if (!response.ok || !response.body) {
        const text = await response.text();
        throw new Error(text || `Loi server: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let fullContent = "";

      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          const chunk = decoder.decode(result.value, { stream: !done });
          fullContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: fullContent, status: "streaming" }
                : m,
            ),
          );
        }
      }

      // Stream kết thúc → đổi status thành "done" để tắt spinner
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, status: "done" } : m,
        ),
      );
    } catch (streamError) {
      if (streamError.name !== "AbortError") {
        const errMsg = streamError.message || "Khong nhan duoc phan hoi tu AI.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: errMsg, status: "error" }
              : m,
          ),
        );
        setErrorMessage(errMsg);
        setErrorSnackbar(true);
      }
    } finally {
      abortRef.current = null;
      setIsStreaming(false);
      isStreamingRef.current = false;
      fetchHistory(); // Refresh chat list from backend
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    // Mark streaming message as stopped
    setMessages((prev) =>
      prev.map((m) =>
        m.status === "streaming" ? { ...m, status: "stopped" } : m,
      ),
    );
    setInput(savedInput);
  };

  const openConfirm = (title, message, onConfirm) =>
    setConfirmDialog({ open: true, title, message, onConfirm });

  const closeConfirm = () =>
    setConfirmDialog({ open: false, title: "", message: "", onConfirm: null });

  const handleClear = () => {
    if (!activeChatId) return; // chat mới chưa có gì
    openConfirm(
      "Xóa cuộc trò chuyện",
      "Bạn có chắc muốn xóa cuộc trò chuyện này không? Hành động này không thể hoàn tác.",
      async () => {
        if (isStreaming) abortRef.current?.abort();
        try {
          await deleteFetcher(`/api/conversations/${activeChatId}`);
          setChatHistory((prev) => prev.filter((c) => c.id !== activeChatId));
        } catch (err) {
          console.error("Failed to delete conversation", err);
          setErrorMessage("Không thể xóa cuộc trò chuyện");
          setErrorSnackbar(true);
          return;
        }
        setActiveChatId(null);
        setMessages([]);
        setContextSources(0);
        setInput("");
        inputRef.current?.focus();
      },
    );
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) handleSend();
    }
  };

  const handleSelectChat = (id) => {
    setActiveChatId(id);
  };

  const handleNewChat = () => {
    if (isStreaming) abortRef.current?.abort();
    setActiveChatId(null);
    setMessages([]);
    setContextSources(0);
    setInput("");
    inputRef.current?.focus();
  };

  const handleDeleteChat = (id, event) => {
    event?.stopPropagation();
    openConfirm(
      "Xóa cuộc trò chuyện",
      "Bạn có chắc muốn xóa cuộc trò chuyện này không? Hành động này không thể hoàn tác.",
      async () => {
        try {
          await deleteFetcher(`/api/conversations/${id}`);
          setChatHistory((prev) => prev.filter((c) => c.id !== id));
          if (activeChatId === id) {
            setActiveChatId(null);
            setMessages([]);
            setContextSources(0);
          }
        } catch (err) {
          console.error("Failed to delete conversation", err);
          setErrorMessage("Không thể xóa cuộc trò chuyện");
          setErrorSnackbar(true);
        }
      },
    );
  };

  const handleCopyMessage = async (content, id) => {
    try {
      await navigator.clipboard.writeText(normalizeAssistantText(content));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const handleRegenerate = () => {
    const lastUserIdx = [...messages]
      .reverse()
      .findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    const userMsg = messages[messages.length - 1 - lastUserIdx];
    if (userMsg) {
      // Remove last assistant message
      setMessages((prev) => prev.slice(0, prev.length - 1));
      setInput(userMsg.content);
      setTimeout(() => handleSend(), 50);
    }
  };

  const codeTheme = isDark ? oneDark : oneLight;

  const userInitial = user?.username
    ? user.username.charAt(0).toUpperCase()
    : "U";

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        bgcolor: isDark ? "#0a0f1c" : "#f8fafc",
        backgroundImage: isDark
          ? "radial-gradient(circle at 15% 50%, rgba(20, 83, 171, 0.15), transparent 25%), radial-gradient(circle at 85% 30%, rgba(131, 38, 204, 0.15), transparent 25%)"
          : "radial-gradient(circle at 15% 50%, rgba(186, 230, 253, 0.6), transparent 25%), radial-gradient(circle at 85% 30%, rgba(233, 213, 255, 0.6), transparent 25%)",
        animation: "bg-shift 20s ease-in-out infinite alternate",
        "@keyframes bg-shift": {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "100% 100%" }
        },
      }}
    >
      {/* Sidebar: Chat History */}
      <Box
        sx={{
          width: historyOpen ? SIDEBAR_WIDTH : COLLAPSED_SIDEBAR_WIDTH,
          bgcolor: isDark ? "rgba(15, 23, 42, 0.6)" : "rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(12px)",
          borderRight: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "width 0.3s ease",
          flexShrink: 0,
          boxShadow: isDark ? "none" : "1px 0 10px rgba(0,0,0,0.02)",
        }}
      >
        <Box
          sx={{
            px: 2,
            height: historyOpen ? "71px" : "65px",
            borderBottom: "1px solid",
            borderColor: "divider",
            width: "100%",
            borderRadius: "0 !important",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: historyOpen ? "space-between" : "center",
              alignItems: "center",
              width: "100%",
            }}
          >
            {historyOpen && (
              <Typography variant="h6" fontWeight={700} sx={{ pl: 0.5 }}>
                Lịch sử chat
              </Typography>
            )}
            <Tooltip title="Mở lịch sử chat" placement="right">
              <IconButton onClick={() => setHistoryOpen((prev) => !prev)}>
                <IconMenu2 size={20} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        {/* Sidebar Header */}
        {historyOpen ? (
          <Box
            sx={{
              mt: 2,
              height: "100%",
              width: "100%",
              px: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={handleNewChat}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 600,
                width: "100%",
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                boxShadow: "0 4px 15px rgba(37, 99, 235, 0.2)",
                transition: "all 0.3s ease",
                "&:hover": {
                  background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                  transform: "translateY(-1px)",
                  boxShadow: "0 6px 20px rgba(37, 99, 235, 0.3)",
                }
              }}
            >
              Cuộc trò chuyện mới
            </Button>

            <Paper
              elevation={0}
              sx={{
                display: "flex",
                alignItems: "center",
                px: 1.5,
                py: 0.75,
                borderRadius: "12px",
                bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                backdropFilter: "blur(10px)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
                transition: "all 0.3s ease",
                "&:focus-within": {
                  borderColor: "primary.main",
                  bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                }
              }}
            >
              <IconSearch
                size={18}
                style={{ color: theme.palette.text.secondary }}
              />
              <InputBase
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  ml: 1,
                  flex: 1,
                  fontSize: 14,
                  color: theme.palette.text.primary,
                }}
              />
            </Paper>

            {/* Chat List */}
            <Box sx={{ flex: 1, overflowY: "auto", px: 0 }}>
              {loadingHistory ? (
                <Box sx={{ p: 2, textAlign: "center" }}>
                  <CircularProgress size={24} />
                </Box>
              ) : filteredHistory.length === 0 ? (
                <Box sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">
                    Chưa có cuộc trò chuyện nào
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {filteredHistory.map((chat) => (
                    <ListItem
                      key={chat.id}
                      disablePadding
                      secondaryAction={
                        <Tooltip title="Xoa">
                          <IconButton
                            size="small"
                            onClick={(e) => handleDeleteChat(chat.id, e)}
                            sx={{
                              opacity: 0.6,
                              "&:hover": { opacity: 1, color: "error.main" },
                            }}
                          >
                            <IconTrash size={14} />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemButton
                        selected={activeChatId === chat.id}
                        onClick={() => handleSelectChat(chat.id)}
                        sx={{
                          borderRadius: "10px",
                          mb: 0.5,
                          transition: "all 0.2s ease",
                          "&:hover": {
                            bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                            transform: "translateX(2px)",
                          },
                          "&.Mui-selected": {
                            background: isDark 
                              ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)" 
                              : "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%)",
                            borderLeft: "3px solid",
                            borderColor: "#3b82f6",
                            "&:hover": {
                              background: isDark 
                                ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)" 
                                : "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.12) 100%)",
                            },
                          },
                        }}
                      >
                        <ListItemText
                          primary={chat.title}
                          primaryTypographyProps={{
                            fontSize: 13,
                            noWrap: true,
                            color: theme.palette.text.primary,
                            fontWeight: activeChatId === chat.id ? 600 : 400,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            <Divider />

            {/* User info - clickable to open menu */}
            <Box
              onClick={(e) => setUserAnchor(e.currentTarget)}
              sx={{
                p: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                cursor: "pointer",
                borderRadius: "12px",
                mx: 0,
                mb: 2,
                transition: "all 0.3s ease",
                bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                "&:hover": { 
                  bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                {userInitial}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {user?.username || "User"}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user?.email || ""}
                </Typography>
              </Box>
            </Box>

            <Menu
              anchorEl={userAnchor}
              open={Boolean(userAnchor)}
              onClose={() => setUserAnchor(null)}
              disableAutoFocusItem
              transformOrigin={{ horizontal: "left", vertical: "bottom" }}
              anchorOrigin={{ horizontal: "left", vertical: "top" }}
              PaperProps={{ sx: { minWidth: 180, borderRadius: 2 } }}
            >
              <MenuItem
                onClick={() => {
                  setUserAnchor(null);
                  setProfileOpen(true);
                }}
              >
                <ListItemIcon>
                  <IconUser size={18} />
                </ListItemIcon>
                <ListItemText>Hồ sơ</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setUserAnchor(null);
                  setSettingsOpen(true);
                }}
              >
                <ListItemIcon>
                  <IconSettings size={18} />
                </ListItemIcon>
                <ListItemText>Cài đặt</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={logout} sx={{ color: "error.main" }}>
                <ListItemIcon>
                  <IconLogout size={18} color="error" />
                </ListItemIcon>
                <ListItemText>Đăng xuất</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box
            sx={{
              px: 1.5,
              py: 1.5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.75,
            }}
          >
            <Tooltip title="Cuộc trò chuyện mới" placement="right">
              <IconButton onClick={handleNewChat}>
                <IconPlus size={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Tìm kiếm đoạn chat" placement="right">
              <IconButton onClick={() => setHistoryOpen(true)}>
                <IconSearch size={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Tải lại lịch sử" placement="right">
              <IconButton onClick={fetchHistory} disabled={loadingHistory}>
                {loadingHistory ? (
                  <CircularProgress size={20} />
                ) : (
                  <IconRefresh size={20} />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Main chat area */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: "1px solid",
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
            bgcolor: isDark ? "rgba(15, 23, 42, 0.4)" : "rgba(255, 255, 255, 0.4)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="body1" fontWeight={700}>
              AI Assistant
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="Xóa cuộc trò chuyện">
              <IconButton onClick={handleClear} color="error">
                <IconTrash />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 3,
            py: 4,
            bgcolor: "transparent",
          }}
        >
          {messages.length === 0 ? (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "text.secondary",
                animation: "fadeIn 0.5s ease-out",
                "@keyframes fadeIn": {
                  "0%": { opacity: 0 },
                  "100%": { opacity: 1 }
                }
              }}
            >
              <Box sx={{ 
                animation: "float 3s ease-in-out infinite", 
                "@keyframes float": { 
                  "0%, 100%": { transform: "translateY(0)" }, 
                  "50%": { transform: "translateY(-10px)" } 
                } 
              }}>
                <IconSparkles
                  size={56}
                  style={{ marginBottom: 16, color: theme.palette.primary.main, filter: "drop-shadow(0 0 10px rgba(25, 118, 210, 0.4))" }}
                />
              </Box>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Bạn muốn hỏi gì?
              </Typography>
              <Typography
                variant="body2"
                sx={{ maxWidth: 400, textAlign: "center", opacity: 0.8 }}
              >
                Nhập câu hỏi và nhấn Gửi để bắt đầu cuộc trò chuyện với AI
                Assistant.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {messages.map((message, index) => {
                const isUser = message.role === "user";
                const isStreamingThis =
                  !isUser && message.status === "streaming";
                const isErrorThis = !isUser && message.status === "error";

                return (
                  <Box
                    key={message.id}
                    sx={{
                      display: "flex",
                      justifyContent: isUser ? "flex-end" : "flex-start",
                      alignItems: "flex-start",
                      gap: 1.5,
                    }}
                  >
                    {!isUser && (
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          bgcolor: "primary.main",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {isStreamingThis ? (
                          <CircularProgress
                            size={14}
                            sx={{ color: "#4FC3F7" }}
                          />
                        ) : (
                          <IconSparkles size={16} style={{ color: "white" }} />
                        )}
                      </Box>
                    )}

                    <Box
                      sx={{
                        maxWidth: "70%",
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      <Box
                        sx={{
                          p: 1.5,
                          px: 2,
                          borderRadius: isUser
                            ? "20px 20px 4px 20px"
                            : "20px 20px 20px 4px",
                          background: isUser
                            ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                            : isErrorThis
                              ? "rgba(239, 68, 68, 0.1)"
                              : isDark
                                ? "rgba(30, 41, 59, 0.4)"
                                : "rgba(255, 255, 255, 0.6)",
                          backdropFilter: isUser ? "none" : "blur(12px)",
                          border: isUser ? "none" : `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
                          color: isUser ? "white" : "text.primary",
                          boxShadow: isUser 
                            ? "0 4px 15px rgba(37, 99, 235, 0.2)" 
                            : "0 4px 15px rgba(0,0,0,0.03)",
                          animation: "slideUpFade 0.4s ease-out forwards",
                          "@keyframes slideUpFade": {
                            "0%": { opacity: 0, transform: "translateY(10px)" },
                            "100%": { opacity: 1, transform: "translateY(0)" }
                          }
                        }}
                      >
                        {isUser ? (
                          <Typography
                            variant="body2"
                            sx={{ whiteSpace: "pre-wrap" }}
                          >
                            {message.content}
                          </Typography>
                        ) : (
                          <Box
                            sx={{
                              "& p": { my: 0.5 },
                              "& p:first-of-type": { mt: 0 },
                              "& p:last-child": { mb: 0 },
                              "& ul, & ol": { my: 0.5, pl: 2 },
                              "& li": { my: 0.25 },
                            }}
                          >
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({
                                  node,
                                  inline,
                                  className,
                                  children,
                                  ...props
                                }) {
                                  const match = /language-(\w+)/.exec(
                                    className || "",
                                  );
                                  const codeStr = String(children).replace(
                                    /\n$/,
                                    "",
                                  );
                                  if (!inline && match) {
                                    return (
                                      <Box sx={{ position: "relative", my: 1 }}>
                                        <Box
                                          sx={{
                                            position: "absolute",
                                            top: 8,
                                            right: 8,
                                            zIndex: 1,
                                          }}
                                        >
                                          <Tooltip
                                            title={
                                              copiedId === message.id + "-code"
                                                ? "Da copy!"
                                                : "Copy code"
                                            }
                                          >
                                            <IconButton
                                              size="small"
                                              onClick={() =>
                                                handleCopyMessage(
                                                  codeStr,
                                                  message.id + "-code",
                                                )
                                              }
                                              sx={{
                                                bgcolor:
                                                  "rgba(255,255,255,0.1)",
                                                "&:hover": {
                                                  bgcolor:
                                                    "rgba(255,255,255,0.2)",
                                                },
                                                "& svg": { color: "white" },
                                              }}
                                            >
                                              {copiedId ===
                                              message.id + "-code" ? (
                                                <IconCheck size={14} />
                                              ) : (
                                                <IconCopy size={14} />
                                              )}
                                            </IconButton>
                                          </Tooltip>
                                        </Box>
                                        <SyntaxHighlighter
                                          style={codeTheme}
                                          language={match[1]}
                                          PreTag="div"
                                          customStyle={{
                                            margin: 0,
                                            padding: "8px 12px",
                                            borderRadius: 8,
                                            fontSize: 13,
                                            backgroundColor: "transparent",
                                          }}
                                          {...props}
                                        >
                                          {codeStr}
                                        </SyntaxHighlighter>
                                      </Box>
                                    );
                                  }
                                  return (
                                    <code
                                      sx={{
                                        fontFamily: "monospace",
                                        px: 0.5,
                                        py: 0.2,
                                        borderRadius: 0.5,
                                        bgcolor: isDark
                                          ? "rgba(255,255,255,0.1)"
                                          : "rgba(0,0,0,0.08)",
                                        fontSize: "0.875em",
                                      }}
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  );
                                },
                                pre({ children }) {
                                  return <>{children}</>;
                                },
                              }}
                            >
                              {normalizeAssistantText(message.content)}
                            </ReactMarkdown>
                          </Box>
                        )}
                      </Box>

                      {!isUser && message.status === "done" && (
                        <Box sx={{ display: "flex", gap: 0.5, pl: 1 }}>
                          <Tooltip title="Copy">
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleCopyMessage(message.content, message.id)
                              }
                              sx={{
                                opacity: 0.5,
                                "&:hover": { opacity: 1 },
                                "& svg": {
                                  color: isDark ? "grey.400" : "grey.600",
                                },
                              }}
                            >
                              {copiedId === message.id ? (
                                <IconCheck size={14} />
                              ) : (
                                <IconCopy size={14} />
                              )}
                            </IconButton>
                          </Tooltip>
                          {index === messages.length - 1 && (
                            <Tooltip title="Tao lai">
                              <IconButton
                                size="small"
                                onClick={handleRegenerate}
                                disabled={isStreaming}
                                sx={{
                                  opacity: 0.5,
                                  "&:hover": { opacity: 1 },
                                  "&.Mui-disabled": { opacity: 0.3 },
                                  "& svg": {
                                    color: isDark ? "grey.400" : "grey.600",
                                  },
                                }}
                              >
                                <IconArrowBackUp size={14} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      )}

                      {isStreamingThis && !message.content && (
                        <Box sx={{ display: "flex", gap: 0.5, pl: 1, pt: 0.5 }}>
                          {[0, 1, 2].map((i) => (
                            <Box
                              key={i}
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                bgcolor: isDark ? "#4FC3F7" : "primary.main",
                                opacity: 0.8,
                                animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`,
                                "@keyframes bounce": {
                                  "0%, 80%, 100%": {
                                    transform: "scale(0.6)",
                                    opacity: 0.4,
                                  },
                                  "40%": { transform: "scale(1)", opacity: 1 },
                                },
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>

                    {isUser && (
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          bgcolor: "success.main",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          color: "white",
                          fontWeight: 600,
                          fontSize: 14,
                        }}
                      >
                        U
                      </Box>
                    )}
                  </Box>
                );
              })}
              <Box ref={bottomRef} />
            </Box>
          )}
        </Box>

        {/* Input area */}
        <Box
          sx={{
            px: 3,
            py: 3,
            background: isDark 
              ? "linear-gradient(to top, rgba(10, 15, 28, 1) 20%, rgba(10, 15, 28, 0))" 
              : "linear-gradient(to top, rgba(248, 250, 252, 1) 20%, rgba(248, 250, 252, 0))",
            flexShrink: 0,
            position: "relative",
            zIndex: 10,
          }}
        >
          <Paper
            elevation={isDark ? 0 : 4}
            sx={{
              display: "flex",
              alignItems: "flex-end",
              p: 1,
              borderRadius: "24px",
              bgcolor: isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
              maxWidth: { xs: "100%", sm: "80%" },
              mx: { xs: 0, sm: "auto" },
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:focus-within": {
                transform: "translateY(-2px)",
                boxShadow: isDark 
                  ? "0 10px 30px rgba(0,0,0,0.5)" 
                  : "0 10px 30px rgba(0,0,0,0.1)",
                borderColor: "primary.main"
              }
            }}
          >
            <InputBase
              placeholder="Nhập câu hỏi..."
              multiline
              maxRows={6}
              fullWidth
              value={input}
              inputRef={inputRef}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              sx={{
                px: 1.5,
                py: 1,
                fontSize: 15,
                color: theme.palette.text.primary,
                "& fieldset": { border: "none" },
              }}
            />
            <IconButton
              onClick={
                isStreaming ? handleStop : canSend ? handleSend : undefined
              }
              sx={{
                background: isStreaming
                  ? "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)"
                  : input.trim()
                    ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                    : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                color: input.trim() || isStreaming ? "white" : "text.disabled",
                "&:hover": {
                  background: isStreaming
                    ? "linear-gradient(135deg, #e11d48 0%, #be123c 100%)"
                    : input.trim()
                      ? "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)"
                      : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
                  transform: input.trim() || isStreaming ? "scale(1.05)" : "none",
                },
                borderRadius: "50%",
                width: 40,
                height: 40,
                ml: 1,
                flexShrink: 0,
                boxShadow:
                  input.trim()
                    ? "0 4px 14px rgba(37, 99, 235, 0.3)"
                    : isStreaming
                      ? "0 4px 14px rgba(225, 29, 72, 0.4)"
                      : "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {isStreaming ? (
                <IconPlayerStop size={20} />
              ) : (
                <IconSend size={20} />
              )}
            </IconButton>
          </Paper>
        </Box>
      </Box>

      <Snackbar
        open={errorSnackbar}
        autoHideDuration={4000}
        onClose={() => setErrorSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setErrorSnackbar(false)}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>

      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onRefresh={fetchHistory}
        onChatConfigChange={handleChatConfigChange}
        onClearChat={() => {
          setActiveChatId(null);
          setMessages([]);
          setContextSources(0);
          setInput("");
          inputRef.current?.focus();
        }}
      />

      {/* Confirm delete dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={closeConfirm}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={closeConfirm} sx={{ textTransform: "none" }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="error"
            sx={{ textTransform: "none" }}
            onClick={async () => {
              closeConfirm();
              await confirmDialog.onConfirm?.();
            }}
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SimpleChatApp;
