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
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE_API_URL}/users?page=${page}&page_size=${pageSize}&search=${encodeURIComponent(search)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then((res) => res.json())
      .then((data) => {
        // Giả định backend trả về { data: [...], total: ... }
        const normalizeUser = (u) => ({
          ...u,
          role: u.role || (Array.isArray(u.roles) && u.roles.length > 0 ? u.roles[0] : "user")
        });
        if (Array.isArray(data)) {
          setUsers(data.map(normalizeUser));
          setTotal(0); // fallback nếu backend chưa trả về tổng
        } else {
          setUsers((data.data || []).map(normalizeUser));
          setTotal(data.total || 0);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [token, page, pageSize, search]);

  // Thêm user
  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch(`${BASE_API_URL}/users?page=${page}&page_size=${pageSize}&search=${encodeURIComponent(search)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    const data = await res.json();
    const normalizeUser = (u) => ({
      ...u,
      role: u.role || (Array.isArray(u.roles) && u.roles.length > 0 ? u.roles[0] : "user")
    });
    if (Array.isArray(data)) {
      setUsers(data.map(normalizeUser));
      setTotal(0);
    } else {
      setUsers((data.data || []).map(normalizeUser));
      setTotal(data.total || 0);
    }
    setLoading(false);
  };

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
    await res.json();
    await fetchUsers();
    return true;
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
    await res.json();
    await fetchUsers();
    return true;
  };

  // Xoá user
  const deleteUser = async (userId) => {
    const res = await fetch(`${BASE_API_URL}/users/${userId}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error("Xoá user thất bại");
    await fetchUsers();
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
    let updatedUser = await res.json();
    updatedUser = {
      ...updatedUser,
      role: updatedUser.role || (Array.isArray(updatedUser.roles) && updatedUser.roles.length > 0 ? updatedUser.roles[0] : "user")
    };
    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    return updatedUser;
  };

  // Sửa permissions user (root, admin có quyền sửa user)
  const updateUserPermissions = async (userId, permissions) => {
    // Gọi đúng endpoint backend: PUT /users/{user_id}
    const res = await fetch(`${BASE_API_URL}/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ permissions })
    });
    if (!res.ok) throw new Error("Sửa permissions thất bại");
    let updatedUser = await res.json();
    updatedUser = {
      ...updatedUser,
      role: updatedUser.role || (Array.isArray(updatedUser.roles) && updatedUser.roles.length > 0 ? updatedUser.roles[0] : "user")
    };
    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    return updatedUser;
  };

  // Lấy user hiện tại
  const fetchMe = async () => {
    const res = await fetch(`${BASE_API_URL}/users/me`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error("Không lấy được thông tin user");
    let me = await res.json();
    me = {
      ...me,
      role: me.role || (Array.isArray(me.roles) && me.roles.length > 0 ? me.roles[0] : "user")
    };
    return me;
  };

  // Sửa permissions của chính mình
  const updateMePermissions = async (userId, permissions) => {
    // Gọi đúng endpoint backend: PUT /users/{user_id}
    const res = await fetch(`${BASE_API_URL}/users/${userId}`, {
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
    let user = await res.json();
    user = {
      ...user,
      role: user.role || (Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : "user")
    };
    return user;
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
        fetchUsers,
        page,
        setPage,
        pageSize,
        setPageSize,
        total,
        search,
        setSearch
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUsers() {
  return useContext(UserContext);
}
