import React, { createContext, useContext, useEffect, useState } from "react";
import { BASE_API_URL } from "app/config";
import { useAuthCustom } from "app/contexts/AuthContext";

const DemoContext = createContext();

export function DemoProvider({ children }) {
  const auth = useAuthCustom();
  const token = auth.token || "";
  const [demos, setDemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page,
      page_size: pageSize,
      ...(search ? { search } : {})
    });
    fetch(`${BASE_API_URL}/demos?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then((res) => res.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : data.data;
        setDemos(Array.isArray(arr) ? arr : []);
        setTotal(data.total || arr.length || 0);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [token, page, pageSize, search]);

  const createDemo = async (demoData) => {
    const res = await fetch(`${BASE_API_URL}/demos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(demoData)
    });
    if (!res.ok) throw new Error("Thêm demo thất bại");
    await fetchDemos();
  };

  const updateDemo = async (demoId, demoData) => {
    const res = await fetch(`${BASE_API_URL}/demos/${demoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(demoData)
    });
    if (!res.ok) throw new Error("Sửa demo thất bại");
    await fetchDemos();
  };

  const deleteDemo = async (demoId) => {
    const res = await fetch(`${BASE_API_URL}/demos/${demoId}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error("Xoá demo thất bại");
    await fetchDemos();
  };

  const fetchDemos = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page,
      page_size: pageSize,
      ...(search ? { search } : {})
    });
    const res = await fetch(`${BASE_API_URL}/demos?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    const data = await res.json();
    const arr = Array.isArray(data) ? data : data.data;
    setDemos(Array.isArray(arr) ? arr : []);
    setTotal(data.total || arr.length || 0);
    setLoading(false);
  };

  return (
    <DemoContext.Provider
      value={{ demos, loading, error, createDemo, updateDemo, deleteDemo, page, setPage, pageSize, setPageSize, total, search, setSearch }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}
