import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { IconDotsVertical } from "@tabler/icons-react";

export default function UserThemeTable({ rows, loading, onMenuClick }) {
  return (
    <TableContainer>
      <Table sx={{ minWidth: 750 }} size="medium">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Username</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Họ tên</TableCell>
            <TableCell>SĐT</TableCell>
            <TableCell>Vai trò</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                {!loading && "Không có dữ liệu"}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.username}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.full_name}</TableCell>
                <TableCell>{row.phone}</TableCell>
                <TableCell>
                  {row.roles?.length
                    ? row.roles.map((r) => (
                        <Chip
                          key={r}
                          label={r}
                          size="small"
                          color={
                            r === "root"
                              ? "error"
                              : r === "admin"
                              ? "warning"
                              : "secondary"
                          }
                          sx={{ mr: 0.5 }}
                        />
                      ))
                    : "-"}
                </TableCell>
                <TableCell>
                  {row.is_active ? (
                    <Chip label="Hoạt động" color="success" size="small" />
                  ) : (
                    <Chip label="Ngừng" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <IconButton onClick={(e) => onMenuClick(e, row)}>
                    <IconDotsVertical width={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
