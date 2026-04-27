import { NextResponse } from "next/server";

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

    // If there's a query, create conversation with message and stream
    if (body.query) {
      const streamResponse = await fetch(`${baseUrl}/api/conversations/new-with-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          title: body.title,
          query: body.query,
          collection_name: body.collection_name,
          limit: body.limit,
          use_reranker: body.use_reranker,
          rerank_top_k: body.rerank_top_k,
          score_threshold: body.score_threshold,
        }),
      });

      if (!streamResponse.ok) {
        const errorText = await streamResponse.text();
        return new Response(errorText, { status: streamResponse.status });
      }

      // Return streaming response with conversation ID header
      return new Response(streamResponse.body, {
        status: 200,
        headers: {
          "Content-Type": streamResponse.headers.get("Content-Type") || "text/plain; charset=utf-8",
          "X-Conversation-Id": streamResponse.headers.get("X-Conversation-Id") || "",
          "X-Context-Sources": streamResponse.headers.get("X-Context-Sources") || "0",
        },
      });
    }

    // Create conversation with title only (no message)
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
