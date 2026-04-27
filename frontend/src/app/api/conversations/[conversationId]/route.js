export async function GET(req, { params }) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { conversationId } = await params;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    const upstreamResponse = await fetch(`${baseUrl}/api/conversations/${conversationId}`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      return new Response(errorText, { status: upstreamResponse.status });
    }

    const data = await upstreamResponse.json();
    return Response.json(data);
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch conversation", detail: error.message }),
      { status: 500 },
    );
  }
}
