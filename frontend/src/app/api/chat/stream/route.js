export async function POST(req) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await req.json();
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    const upstreamUrl = `${baseUrl}/api/chat/ask/stream`;

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
      return new Response(
        JSON.stringify({
          error: "Upstream chat stream failed",
          detail: errorText || upstreamResponse.statusText,
        }),
        { status: upstreamResponse.status },
      );
    }

    return new Response(upstreamResponse.body, {
      status: 200,
      headers: {
        "Content-Type": upstreamResponse.headers.get("Content-Type") || "text/plain; charset=utf-8",
        "X-Context-Sources": upstreamResponse.headers.get("X-Context-Sources") || "0",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to stream chat", detail: error.message }),
      { status: 500 },
    );
  }
}
