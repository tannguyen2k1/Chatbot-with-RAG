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

    // Create conversation with title only
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

    // If there's a query, add message and stream
    if (body.query) {
      const streamResponse = await fetch(`${baseUrl}/api/conversations/${convData.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
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
          "X-Conversation-Id": String(convData.id),
          "X-Context-Sources": streamResponse.headers.get("X-Context-Sources") || "0",
        },
      });
    }

    return Response.json(convData);
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to create conversation", detail: error.message }),
      { status: 500 },
    );
  }
}
