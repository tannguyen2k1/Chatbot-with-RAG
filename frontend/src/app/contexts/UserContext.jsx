import React, { createContext, useContext, useEffect, useState } from "react";
import { BASE_API_URL } from "app/config";
import { useAuthCustom } from "app/contexts/AuthContext";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuthCustom();

  // Phân trang
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE_API_URL}/users?page=${page}&page_size=${pageSize}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then((res) => res.json())
      .then((data) => {
        // Giả định backend trả về { data: [...], total: ... }
        if (Array.isArray(data)) {
          setUsers(data);
          setTotal(0); // fallback nếu backend chưa trả về tổng
        } else {
          setUsers(data.data || []);
          setTotal(data.total || 0);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [token, page, pageSize]);

  // Thêm user
  const addUser = async (userData) => {
    const res = await fetch(`${BASE_API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(userData)
    });
    if (!res.ok) throw new Error("Thêm user thất bại");
    const newUser = await res.json();
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  // Sửa user
  const updateUser = async (userId, userData) => {
    const res = await fetch(`${BASE_API_URL}/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(userData)
    });
    if (!res.ok) throw new Error("Sửa user thất bại");
    const updatedUser = await res.json();
    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    return updatedUser;
  };

  // Xoá user
  const deleteUser = async (userId) => {
    const res = await fetch(`${BASE_API_URL}/users/${userId}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error("Xoá user thất bại");
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    return true;
  };

  // Sửa role user (chỉ root mới có quyền)
  const updateUserRole = async (userId, role) => {
    const res = await fetch(`${BASE_API_URL}/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ role })
    });
    if (!res.ok) throw new Error("Sửa role thất bại");
    const updatedUser = await res.json();
    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    return updatedUser;
  };

  // Sửa permissions user (root, admin có quyền sửa user)
  const updateUserPermissions = async (userId, permissions) => {
    const res = await fetch(`${BASE_API_URL}/users/${userId}/permissions`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ permissions })
    });
    if (!res.ok) throw new Error("Sửa permissions thất bại");
    const updatedUser = await res.json();
    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    return updatedUser;
  };

  // Lấy user hiện tại
  const fetchMe = async () => {
    const res = await fetch(`${BASE_API_URL}/users/me`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error("Không lấy được thông tin user");
    return await res.json();
  };

  // Sửa permissions của chính mình
  const updateMePermissions = async (userId, permissions) => {
    const res = await fetch(`${BASE_API_URL}/users/${userId}/permissions`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ permissions })
    });
    if (!res.ok) throw new Error("Sửa permissions thất bại");
    return await res.json();
  };

  // Lấy quyền module của user
  const fetchUserModulePermissions = async (userId) => {
    const res = await fetch(`${BASE_API_URL}/user-module-permissions/user/${userId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error("Không lấy được quyền module");
    return await res.json();
  };

  // Lấy thông tin user theo id
  const fetchUserById = async (userId) => {
    const res = await fetch(`${BASE_API_URL}/users/${userId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error("Không lấy được thông tin user");
    return await res.json();
  };

  return (
    <UserContext.Provider
      value={{
        users,
        loading,
        error,
        addUser,
        updateUser,
        deleteUser,
        updateUserRole,
        updateUserPermissions,
        fetchMe,
        updateMePermissions,
        fetchUserModulePermissions,
        fetchUserById,
        page,
        setPage,
        pageSize,
        setPageSize,
        total
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUsers() {
  return useContext(UserContext);
}
