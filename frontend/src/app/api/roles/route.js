
import { getFetcher, postFetcher, putFetcher, deleteFetcher } from '@/app/api/globalFetcher';

// API proxy cho roles (chuẩn backend: /api/rbac/roles)
export async function GET(req) {
  try {
    const data = await getFetcher('/api/rbac/roles');
    // Trả về mảng tên role cho frontend
    const roles = Array.isArray(data) ? data.map(r => r.name) : [];
    return new Response(JSON.stringify(roles), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify([]), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const data = await postFetcher('/api/rbac/roles', body);
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, ...body } = await req.json();
    const data = await putFetcher(`/api/rbac/roles/${id}`, body);
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    const data = await deleteFetcher(`/api/rbac/roles/${id}`);
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
