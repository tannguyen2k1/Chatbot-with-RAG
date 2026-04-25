"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Fab,
  Paper,
  Typography,
  IconButton,
  TextField,
  Avatar,
  Stack,
  Fade,
  useTheme,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  IconMessageCircle,
  IconX,
  IconSend,
  IconRobot,
  IconUser,
} from "@tabler/icons-react";
import { postFetcher, getFetcher } from "@/app/api/globalFetcher";

const ChatSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatConfig, setChatConfig] = useState(null);
  const [chatHistory, setChatHistory] = useState([
    {
      role: "assistant",
      content: "Xin chào! Tôi có thể giúp gì cho bạn hôm nay?",
    },
  ]);
  const scrollRef = useRef(null);
  const theme = useTheme();

  useEffect(() => {
    // Fetch chat config on load
    const fetchConfig = async () => {
      try {
        const config = await getFetcher("/api/configs/chat");
        setChatConfig(config);
      } catch (err) {
        console.error("Failed to fetch chat config", err);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  const handleSend = async () => {
    if (!message.trim() || loading) return;

    if (!chatConfig?.collection_name) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Collections chua duoc set" },
      ]);
      return;
    }

    const userMessage = message;
    setChatHistory((prev) => [...prev, { role: "user", content: userMessage }]);
    setMessage("");
    setLoading(true);

    try {
      const response = await postFetcher("/api/chat/ask", {
        query: userMessage,
        collection_name: chatConfig.collection_name,
        limit: chatConfig.limit || 3,
        use_reranker: chatConfig.use_reranker ?? true,
        rerank_top_k: chatConfig.rerank_top_k || 30,
      });

      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.answer || "Xin lỗi, tôi gặp lỗi khi trả lời.",
        },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      const errMsg = err.message || "";
      if (errMsg.includes("collection") || errMsg.includes("Collection")) {
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: "Collections chua duoc set" },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: "Rất tiếc, đã có lỗi xảy ra khi kết nối tới máy chủ." },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="chat"
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          position: "fixed",
          bottom: 30,
          right: 30,
          zIndex: 1000,
          boxShadow: theme.shadows[10],
          transition: "transform 0.3s ease-in-out",
          "&:hover": {
            transform: "scale(1.1)",
          },
        }}
      >
        {isOpen ? <IconX size={24} /> : <IconMessageCircle size={24} />}
      </Fab>

      {/* Chat Window */}
      <Fade in={isOpen}>
        <Paper
          elevation={10}
          sx={{
            position: "fixed",
            bottom: 100,
            right: 30,
            width: { xs: "calc(100% - 60px)", sm: 350 },
            height: 500,
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.mode === "dark" ? "rgba(33, 43, 54, 0.9)" : "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: "white", color: "primary.main" }}>
                <IconRobot size={24} />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  AI Support
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Trực tuyến
                </Typography>
              </Box>
            </Stack>
            <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: "inherit" }}>
              <IconX size={20} />
            </IconButton>
          </Box>

          {/* Message List */}
          <Box
            ref={scrollRef}
            sx={{
              flexGrow: 1,
              p: 2,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              scrollbarWidth: "thin",
              "&::-webkit-scrollbar": { width: "4px" },
              "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(0,0,0,0.1)", borderRadius: 2 },
            }}
          >
            {chatHistory.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  alignItems: "flex-end",
                  gap: 1,
                }}
              >
                {msg.role === "assistant" && (
                  <Avatar sx={{ width: 28, height: 28, bgcolor: "primary.light" }}>
                    <IconRobot size={16} />
                  </Avatar>
                )}
                <Paper
                  sx={{
                    p: 1.5,
                    maxWidth: "80%",
                    borderRadius: msg.role === "user" ? "20px 20px 5px 20px" : "20px 20px 20px 5px",
                    bgcolor: msg.role === "user" ? "primary.main" : "grey.100",
                    color: msg.role === "user" ? "white" : "text.primary",
                    boxShadow: "none",
                  }}
                >
                  <Typography variant="body2">{msg.content}</Typography>
                </Paper>
                {msg.role === "user" && (
                  <Avatar sx={{ width: 28, height: 28, bgcolor: "secondary.main" }}>
                    <IconUser size={16} />
                  </Avatar>
                )}
              </Box>
            ))}
            {loading && (
              <Box sx={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-end", gap: 1 }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: "primary.light" }}>
                  <IconRobot size={16} />
                </Avatar>
                <Paper
                  sx={{
                    p: 1.5,
                    borderRadius: "20px 20px 20px 5px",
                    bgcolor: "grey.100",
                    color: "text.secondary",
                    boxShadow: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <CircularProgress size={16} thickness={5} />
                  <Typography variant="body2">AI đang trả lời...</Typography>
                </Paper>
              </Box>
            )}
          </Box>

          {/* Footer Input */}
          <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Nhập tin nhắn..."
              size="small"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton color="primary" onClick={handleSend} disabled={!message.trim()}>
                      <IconSend size={20} />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 },
              }}
            />
          </Box>
        </Paper>
      </Fade>
    </>
  );
};

export default ChatSupport;
