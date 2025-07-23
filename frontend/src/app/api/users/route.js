// Proxy API cho /api/users (chuẩn backend: /api/users)
// Hỗ trợ GET (danh sách), POST (tạo), DELETE (xoá), PATCH (sửa)

export async function GET(req) {
  const { getFetcher } = await import('../../api/globalFetcher.js');
  const url = new URL(req.url, 'http://localhost');
  const search = url.search || '';
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const options = { token: authHeader.replace('Bearer ', '') };
  try {
    const data = await getFetcher('/api/users' + search, options);
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function POST(req) {
  const { postFetcher } = await import('../../api/globalFetcher.js');
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const options = { token: authHeader.replace('Bearer ', '') };
  const body = await req.json();
  try {
    const data = await postFetcher('/api/users', body, options);
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function DELETE(req) {
  const { deleteFetcher } = await import('../../api/globalFetcher.js');
  const url = new URL(req.url, 'http://localhost');
  const id = url.pathname.split('/').pop();
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const options = { token: authHeader.replace('Bearer ', '') };
  try {
    const data = await deleteFetcher('/api/users/' + id, null, options);
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}


export async function PUT(req) {
  const { patchFetcher } = await import('../../api/globalFetcher.js');
  const url = new URL(req.url, 'http://localhost');
  const id = url.pathname.split('/').pop();
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const options = { token: authHeader.replace('Bearer ', '') };
  const body = await req.json();
  try {
    const data = await patchFetcher('/api/users/' + id, body, options);
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
