import { BASE_API_URL } from "app/config";

export async function fetchDemos({ token, page = 1, pageSize = 10, search = "" } = {}) {
  const params = new URLSearchParams({
    page,
    page_size: pageSize,
    ...(search ? { search } : {})
  });
  const res = await fetch(`${BASE_API_URL}/demos?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  const data = await res.json();
  const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return {
    demos: arr,
    total: (data && typeof data.total === "number") ? data.total : arr.length
  };
}

export async function createDemo({ token, demoData }) {
  const res = await fetch(`${BASE_API_URL}/demos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(demoData)
  });
  if (!res.ok) throw new Error("Thêm demo thất bại");
  return await res.json();
}

export async function updateDemo({ token, demoId, demoData }) {
  const res = await fetch(`${BASE_API_URL}/demos/${demoId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(demoData)
  });
  if (!res.ok) throw new Error("Sửa demo thất bại");
  return await res.json();
}

export async function deleteDemo({ token, demoId }) {
  const res = await fetch(`${BASE_API_URL}/demos/${demoId}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error("Xoá demo thất bại");
  return true;
}
