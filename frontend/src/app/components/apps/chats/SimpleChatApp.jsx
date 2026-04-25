"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
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
  Drawer,
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
  Button
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
} from "@tabler/icons-react";
import { useAuth } from "@/app/context/AuthContext";
import ProfileDialog from "@/app/components/user/ProfileDialog";
import SettingsDialog from "@/app/components/user/SettingsDialog";

const STORAGE_KEY = "ai_chat_history";
const MAX_TITLE_CHARS = 40;
const SIDEBAR_WIDTH = 300;
const DEFAULT_COLLECTION = "default";

const normalizeAssistantText = (text) => {
  if (!text) return "";
  return text.replace(/^"+|"+$/g, "");
};

const generateTitle = (firstMessage) => {
  const clean = firstMessage.replace(/\n+/g, " ").trim();
  if (clean.length <= MAX_TITLE_CHARS) return clean;
  return clean.substring(0, MAX_TITLE_CHARS - 1) + "...";
};

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveHistory = (history) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch { }
};

const configMenuStyle = {
  width: 320,
  p: "16px",
  maxHeight: 480,
};

const SimpleChatApp = () => {
  const theme = useTheme();
  const { getAccessToken, user, logout } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatHistory, setChatHistory] = useState(() => loadHistory());
  const [activeChatId, setActiveChatId] = useState(null);
  const [contextSources, setContextSources] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorSnackbar, setErrorSnackbar] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [configAnchor, setConfigAnchor] = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [chatConfig, setChatConfig] = useState({
    collection_name: DEFAULT_COLLECTION,
    limit: 3,
    use_reranker: true,
    rerank_top_k: 30,
  });

  const bottomRef = useRef(null);
  const abortRef = useRef(null);
  const inputRef = useRef(null);

  const isDark = theme.palette.mode === "dark";

  useEffect(() => {
    saveHistory(chatHistory);
  }, [chatHistory]);

  useEffect(() => {
    const chat = chatHistory.find((c) => c.id === activeChatId);
    if (chat) {
      setMessages(chat.messages || []);
      setContextSources(chat.contextSources || 0);
    } else {
      setMessages([]);
      setContextSources(0);
    }
  }, [activeChatId]);

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return chatHistory;
    return chatHistory.filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [chatHistory, searchQuery]);

  const canSend = useMemo(
    () => !isStreaming && input.trim().length > 0,
    [input, isStreaming],
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

    setInput("");
    setIsStreaming(true);
    setErrorMessage("");

    let currentChatId = activeChatId;
    const isNewChat = !currentChatId;
    if (isNewChat) {
      const newId = Date.now();
      const newChat = {
        id: newId,
        title: generateTitle(prompt),
        messages: [],
        contextSources: 0,
        createdAt: new Date().toISOString(),
      };
      setChatHistory((prev) => [newChat, ...prev]);
      currentChatId = newId;
      setActiveChatId(newId);
    } else {
      setChatHistory((prev) =>
        prev.map((c) =>
          c.id === currentChatId &&
            (c.title === "Cuoc tro chuyen moi" || c.title === "New Chat")
            ? { ...c, title: generateTitle(prompt) }
            : c,
        ),
      );
    }

    const userMessage = { id: `user-${Date.now()}`, role: "user", content: prompt };
    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage = { id: assistantId, role: "assistant", content: "", status: "streaming" };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: prompt,
          ...chatConfig,
        }),
        signal: controller.signal,
      });

      const sourcesHeader = response.headers.get("X-Context-Sources");
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
              m.id === assistantId ? { ...m, content: fullContent, status: "done" } : m,
            ),
          );
        }
      }
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
    }
  };

  useEffect(() => {
    if (activeChatId && messages.length > 0) {
      const hasDone = messages.some((m) => m.role === "assistant" && m.status === "done");
      if (hasDone) {
        setChatHistory((prev) =>
          prev.map((c) =>
            c.id === activeChatId
              ? { ...c, messages: messages, contextSources }
              : c,
          ),
        );
      }
    }
  }, [messages, contextSources, activeChatId]);

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleClear = () => {
    if (isStreaming) abortRef.current?.abort();
    setMessages([]);
    setContextSources(0);
    if (activeChatId) {
      setChatHistory((prev) =>
        prev.map((c) =>
          c.id === activeChatId ? { ...c, messages: [], contextSources: 0 } : c,
        ),
      );
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) handleSend();
    }
  };

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    setHistoryOpen(false);
  };

  const handleNewChat = () => {
    if (isStreaming) abortRef.current?.abort();
    const newId = Date.now();
    const newChat = {
      id: newId,
      title: "Cuoc tro chuyen moi",
      messages: [],
      contextSources: 0,
      createdAt: new Date().toISOString(),
    };
    setChatHistory((prev) => [newChat, ...prev]);
    setActiveChatId(newId);
    setMessages([]);
    setContextSources(0);
    setInput("");
    inputRef.current?.focus();
    setHistoryOpen(false);
  };

  const handleDeleteChat = (id, event) => {
    event.stopPropagation();
    setChatHistory((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) {
      const remaining = chatHistory.filter((c) => c.id !== id);
      setActiveChatId(remaining[0]?.id || null);
      setMessages([]);
      setContextSources(0);
    }
  };

  const handleCopyMessage = async (content, id) => {
    try {
      await navigator.clipboard.writeText(normalizeAssistantText(content));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { }
  };

  const handleRegenerate = () => {
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    const userMsg = messages[messages.length - 1 - lastUserIdx];
    if (userMsg) {
      setMessages((prev) => prev.slice(0, prev.length - 1));
      setInput(userMsg.content);
      setTimeout(() => handleSend(), 50);
    }
  };

  const codeTheme = isDark ? oneDark : oneLight;

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : "U";

  return (
    <Box sx={{ display: "flex", height: "100%", width: "100%", overflow: "hidden" }}>
      {/* Drawer: Chat History */}
      <Drawer
        anchor="left"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        PaperProps={{
          sx: {
            width: SIDEBAR_WIDTH,
            bgcolor: isDark ? "background.paper" : "grey.50",
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        {/* Drawer Header */}
        <Box
          sx={{
            p: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight={700} sx={{ pl: 0.5 }}>
              Lịch sử chat
            </Typography>
            <IconButton size="small" onClick={() => setHistoryOpen(false)}>
              <IconX size={18} />
            </IconButton>
          </Box>

          <Button
            fullWidth
            variant="contained"
            startIcon={<IconPlus size={18} />}
            onClick={handleNewChat}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Cuoc tro chuyen moi
          </Button>

          <Paper
            variant="outlined"
            sx={{
              display: "flex",
              alignItems: "center",
              px: 1,
              py: 0.5,
              borderRadius: 2,
              bgcolor: isDark ? "grey.800" : "background.paper",
            }}
          >
            <IconSearch size={18} style={{ color: theme.palette.text.secondary }} />
            <InputBase
              placeholder="Tim kiem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ ml: 1, flex: 1, fontSize: 14, color: theme.palette.text.primary }}
            />
          </Paper>
        </Box>

        {/* Chat List */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 1 }}>
          {filteredHistory.length === 0 ? (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                Chua co cuoc tro chuyen nao
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
                        sx={{ opacity: 0.6, "&:hover": { opacity: 1, color: "error.main" } }}
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
                      borderRadius: 1.5,
                      mb: 0.5,
                      "&.Mui-selected": {
                        bgcolor: isDark ? "primary.dark" : "primary.light",
                        "&:hover": { bgcolor: isDark ? "primary.dark" : "primary.light" },
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
            "&:hover": { bgcolor: "action.hover" },
            borderRadius: 1,
            mx: 1,
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
          transformOrigin={{ horizontal: "left", vertical: "bottom" }}
          anchorOrigin={{ horizontal: "left", vertical: "top" }}
          PaperProps={{ sx: { minWidth: 180, borderRadius: 2 } }}
        >
          <MenuItem onClick={() => { setUserAnchor(null); setProfileOpen(true); }}>
            <ListItemIcon><IconUser size={18} /></ListItemIcon>
            <ListItemText>Hồ sơ</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setUserAnchor(null); setSettingsOpen(true); }}>
            <ListItemIcon><IconSettings size={18} /></ListItemIcon>
            <ListItemText>Cài đặt</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={logout} sx={{ color: "error.main" }}>
            <ListItemIcon><IconLogout size={18} color="error" /></ListItemIcon>
            <ListItemText>Đăng xuất</ListItemText>
          </MenuItem>
        </Menu>
      </Drawer>

      {/* Main chat area */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: isDark ? "background.paper" : "background.default",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Tooltip title="Lich su chat">
              <IconButton onClick={() => setHistoryOpen(true)} sx={{ color: theme.palette.text.secondary }}>
                <IconMenu2 size={20} />
              </IconButton>
            </Tooltip>
            <Typography variant="h6" fontWeight={700}>
              AI Assistant
            </Typography>
            {contextSources > 0 && (
              <Chip
                label={`${contextSources} nguon`}
                size="small"
                sx={{ height: 20, fontSize: 11, bgcolor: isDark ? "grey.800" : "grey.200" }}
              />
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="Cau hinh">
              <IconButton
                onClick={(e) => setConfigAnchor(e.currentTarget)}
                sx={{ color: configAnchor ? "primary.main" : "inherit" }}
              >
                <IconSettings size={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Dung phan hoi">
              <span>
                <IconButton
                  onClick={handleStop}
                  disabled={!isStreaming}
                  sx={{
                    color: isStreaming ? "warning.main" : "inherit",
                    "&.Mui-disabled": { color: "grey.400" },
                  }}
                >
                  <IconPlayerStop />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Xoa cuoc tro chuyen">
              <IconButton onClick={handleClear} color="error">
                <IconTrash />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Config Menu */}
        <Menu
          anchorEl={configAnchor}
          open={Boolean(configAnchor)}
          onClose={() => setConfigAnchor(null)}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{ sx: configMenuStyle }}
        >
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>Cau hinh Chat</Typography>
              <IconButton size="small" onClick={() => setConfigAnchor(null)}>
                <IconX size={16} />
              </IconButton>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom sx={{ color: "text.secondary" }}>
                So tai lieu: {chatConfig.limit}
              </Typography>
              <Slider
                value={chatConfig.limit}
                min={1}
                max={20}
                step={1}
                onChange={(_, v) => setChatConfig((p) => ({ ...p, limit: v }))}
                valueLabelDisplay="auto"
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom sx={{ color: "text.secondary" }}>
                Rerank Top-K: {chatConfig.rerank_top_k}
              </Typography>
              <Slider
                value={chatConfig.rerank_top_k}
                min={10}
                max={200}
                step={10}
                onChange={(_, v) => setChatConfig((p) => ({ ...p, rerank_top_k: v }))}
                valueLabelDisplay="auto"
                disabled={!chatConfig.use_reranker}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={chatConfig.use_reranker}
                  onChange={(e) => setChatConfig((p) => ({ ...p, use_reranker: e.target.checked }))}
                  size="small"
                />
              }
              label="Su dung Reranker"
            />
          </Box>
        </Menu>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 3,
            py: 2,
            bgcolor: isDark ? "background.default" : "grey.50",
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
              }}
            >
              <IconSparkles size={48} style={{ marginBottom: 16, color: theme.palette.primary.main }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Ban muon hoi gi?
              </Typography>
              <Typography variant="body2" sx={{ maxWidth: 400, textAlign: "center" }}>
                Nhap cau hoi va nhan Gui de bat dau cuoc tro chuyen voi AI Assistant.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {messages.map((message, index) => {
                const isUser = message.role === "user";
                const isStreamingThis = !isUser && message.status === "streaming";
                const isErrorThis = !isUser && message.status === "error";

                return (
                  <Fade in key={message.id}>
                    <Box
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
                            <CircularProgress size={14} sx={{ color: "white" }} />
                          ) : (
                            <IconSparkles size={16} style={{ color: "white" }} />
                          )}
                        </Box>
                      )}

                      <Box sx={{ maxWidth: "70%", display: "flex", flexDirection: "column", gap: 0.5 }}>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: isUser
                              ? "16px 16px 4px 16px"
                              : "16px 16px 16px 4px",
                            bgcolor: isUser
                              ? "primary.main"
                              : isErrorThis
                                ? "error.light"
                                : isDark
                                  ? "grey.800"
                                  : "background.paper",
                            color: isUser ? "white" : "text.primary",
                            boxShadow: 1,
                          }}
                        >
                          {isUser ? (
                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
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
                                  code({ node, inline, className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || "");
                                    const codeStr = String(children).replace(/\n$/, "");
                                    if (!inline && match) {
                                      return (
                                        <Box sx={{ position: "relative", my: 1 }}>
                                          <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
                                            <Tooltip title={copiedId === message.id + "-code" ? "Da copy!" : "Copy code"}>
                                              <IconButton
                                                size="small"
                                                onClick={() => handleCopyMessage(codeStr, message.id + "-code")}
                                                sx={{
                                                  bgcolor: "rgba(255,255,255,0.1)",
                                                  "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                                                  "& svg": { color: "white" },
                                                }}
                                              >
                                                {copiedId === message.id + "-code" ? <IconCheck size={14} /> : <IconCopy size={14} />}
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
                                          bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
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
                                onClick={() => handleCopyMessage(message.content, message.id)}
                                sx={{
                                  opacity: 0.5,
                                  "&:hover": { opacity: 1 },
                                  "& svg": { color: isDark ? "grey.400" : "grey.600" },
                                }}
                              >
                                {copiedId === message.id ? <IconCheck size={14} /> : <IconCopy size={14} />}
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
                                    "& svg": { color: isDark ? "grey.400" : "grey.600" },
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
                                  bgcolor: "primary.main",
                                  opacity: 0.6,
                                  animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`,
                                  "@keyframes bounce": {
                                    "0%, 80%, 100%": { transform: "scale(0.6)", opacity: 0.4 },
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
                  </Fade>
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
            py: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: isDark ? "background.paper" : "background.default",
            flexShrink: 0,
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              display: "flex",
              alignItems: "flex-end",
              p: 1,
              borderRadius: 2,
              bgcolor: isDark ? "grey.800" : "grey.100",
              borderColor: isDark ? "divider" : undefined,
            }}
          >
            <InputBase
              placeholder="Nhap cau hoi..."
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
              onClick={canSend ? handleSend : undefined}
              disabled={!canSend}
              sx={{
                bgcolor: input.trim() ? "primary.main" : "grey.700",
                color: "white",
                "&:hover": { bgcolor: "primary.dark" },
                "&.Mui-disabled": { bgcolor: "grey.700", color: "grey.500" },
                borderRadius: 2,
                ml: 1,
                flexShrink: 0,
              }}
            >
              {isStreaming ? (
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    border: "2px solid white",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    "@keyframes spin": {
                      "0%": { transform: "rotate(0deg)" },
                      "100%": { transform: "rotate(360deg)" },
                    },
                  }}
                />
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

      <ProfileDialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </Box>
  );
};

export default SimpleChatApp;
