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

export async function GET(req) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    const upstreamResponse = await fetch(`${baseUrl}/api/conversations`, {
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
      JSON.stringify({ error: "Failed to fetch conversations", detail: error.message }),
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await req.json();
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

    if (body.query) {
      const streamResponse = await fetch(`${baseUrl}/api/conversations/new-with-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      });

      if (!streamResponse.ok) {
        const errorText = await streamResponse.text();
        return new Response(errorText, { status: streamResponse.status });
      }

      return new Response(streamResponse.body, {
        status: 200,
        headers: streamHeaders(streamResponse),
      });
    }

    const convResponse = await fetch(`${baseUrl}/api/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ title: body.title }),
    });

    if (!convResponse.ok) {
      const errorText = await convResponse.text();
      return new Response(errorText, { status: convResponse.status });
    }

    const convData = await convResponse.json();
    return Response.json(convData);
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to create conversation", detail: error.message }),
      { status: 500 },
    );
  }
}
