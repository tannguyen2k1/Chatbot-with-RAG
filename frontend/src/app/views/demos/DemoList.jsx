import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box,
  TextField,
  Stack,
  Toolbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import TablePagination from "@mui/material/TablePagination";
import { useDemo } from "app/contexts/DemoContext";

const emptyDemo = { title: "", description: "" };

const DemoList = () => {
  const {
    demos,
    loading,
    error,
    createDemo,
    updateDemo,
    deleteDemo,
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
    search,
    setSearch,
    fetchDemos, // <-- lấy từ context
  } = useDemo();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyDemo);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Luôn reload lại data khi vào trang
  useEffect(() => {
    fetchDemos();
    // eslint-disable-next-line
  }, []);

  // Debounce search to avoid too many backend calls
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1); // reset to first page when search changes
    }, 400);
    return () => clearTimeout(timeout);
  }, [search, setPage]);

  // Trigger backend search when page, pageSize, or search changes
  useEffect(() => {
    // fetchDemos sẽ được gọi trong context mỗi khi page, pageSize, search thay đổi
    // Không cần gọi lại ở đây nếu context đã tự động fetch
  }, [page, pageSize, search]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this demo?")) return;
    try {
      await deleteDemo(id);
    } catch {
      alert("Delete failed");
    }
  };

  const handleEdit = (demo) => {
    setEditId(demo.id);
    setFormData({ title: demo.title, description: demo.description });
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditId(null);
    setFormData(emptyDemo);
    setShowForm(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await updateDemo(editId, formData);
      } else {
        await createDemo(formData);
      }
      setShowForm(false);
      setFormData(emptyDemo);
      setEditId(null);
    } catch {
      alert("Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={3}>
      <Paper elevation={3} sx={{ p: 2 }}>
        <Toolbar sx={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <Typography variant="h5" fontWeight={600}>
            Quản lý Demo
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <SearchIcon color="action" />
            <TextField
              size="small"
              variant="outlined"
              placeholder="Tìm kiếm demo theo tiêu đề hoặc mô tả"
              value={search}
              autoComplete="off"
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 220, background: "#fff" }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreate}
              sx={{ ml: 2 }}
            >
              Thêm Demo
            </Button>
          </Stack>
        </Toolbar>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ background: "#f5f5f5" }}>
                <TableCell>ID</TableCell>
                <TableCell>Tiêu đề</TableCell>
                <TableCell>Mô tả</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Ngày cập nhật</TableCell>
                <TableCell align="right">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : demos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Không có dữ liệu demo
                  </TableCell>
                </TableRow>
              ) : (
                demos.map((demo) => (
                  <TableRow key={demo.id}>
                    <TableCell>{demo.id}</TableCell>
                    <TableCell>{demo.title}</TableCell>
                    <TableCell>{demo.description}</TableCell>
                    <TableCell>
                      {demo.created_at
                        ? new Date(demo.created_at).toLocaleString()
                        : ""}
                    </TableCell>
                    <TableCell>
                      {demo.updated_at
                        ? new Date(demo.updated_at).toLocaleString()
                        : ""}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleEdit(demo)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDelete(demo.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          onPageChange={(e, newPage) => setPage(newPage + 1)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(1);
          }}
          rowsPerPageOptions={[5, 10, 20, 50, 100]}
          labelRowsPerPage="Số dòng mỗi trang"
        />
      </Paper>
      {/* Dialog thêm/sửa demo */}
      <Dialog
        open={showForm}
        onClose={() => setShowForm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editId ? "Sửa Demo" : "Thêm Demo"}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Tiêu đề"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
              <TextField
                label="Mô tả"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                minRows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowForm(false)}>Huỷ</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
            >
              {submitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DemoList;
