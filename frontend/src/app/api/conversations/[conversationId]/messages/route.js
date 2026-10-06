function streamHeaders(upstream, conversationIdFallback = "") {
  return {
    "Content-Type": upstream.headers.get("Content-Type") || "text/plain; charset=utf-8",
    "X-Conversation-Id":
      upstream.headers.get("X-Conversation-Id") || conversationIdFallback || "",
    "X-Context-Sources": upstream.headers.get("X-Context-Sources") || "0",
    "X-Citations": upstream.headers.get("X-Citations") || "",
    "X-Domain": upstream.headers.get("X-Domain") || "",
    "X-Message-Id": upstream.headers.get("X-Message-Id") || "",
  };
}

export async function POST(req, { params }) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { conversationId } = await params;
    const body = await req.json();
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    const upstreamUrl = `${baseUrl}/api/conversations/${conversationId}/messages`;

    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      return new Response(errorText, { status: upstreamResponse.status });
    }

    return new Response(upstreamResponse.body, {
      status: 200,
      headers: streamHeaders(upstreamResponse, conversationId),
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to stream chat", detail: error.message }),
      { status: 500 },
    );
  }
}
