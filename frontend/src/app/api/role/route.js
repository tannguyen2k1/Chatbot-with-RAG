// API proxy cho roles (chuẩn backend: /api/rbac/roles)
export async function GET(req) {
  const backendUrl = process.env.BACKEND_URL || '';
  const res = await fetch(backendUrl + '/api/rbac/roles', {
    headers: { 'Authorization': req.headers.get('Authorization') || '' }
  });
  if (!res.ok) {
    return new Response(JSON.stringify([]), { status: res.status });
  }
  const data = await res.json();
  // Trả về mảng tên role cho frontend
  const roles = Array.isArray(data) ? data.map(r => r.name) : [];
  return new Response(JSON.stringify(roles), { status: 200 });
}
