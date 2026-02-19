import { NextResponse } from "next/server";

const MAX_HTML_SIZE = 100_000; // 100KB limit

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return NextResponse.json(
      { error: "URL must use http or https protocol" },
      { status: 400 },
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SmartBookmark/1.0)",
      },
    });

    clearTimeout(timeoutId);

    // Read only the first chunk to avoid large payloads
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let html = "";

    if (reader) {
      while (html.length < MAX_HTML_SIZE) {
        const { done, value } = await reader.read();
        if (done) break;
        html += decoder.decode(value, { stream: true });
      }
      reader.cancel();
    }

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogTitleMatch = html.match(
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
    );

    // Extract description
    const descMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
    );
    const ogDescMatch = html.match(
      /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
    );

    // Extract OG image
    const ogImageMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    );

    return NextResponse.json({
      title: ogTitleMatch?.[1] || titleMatch?.[1] || "",
      description: ogDescMatch?.[1] || descMatch?.[1] || "",
      ogImage: ogImageMatch?.[1] || "",
    });
  } catch {
    return NextResponse.json({ title: "", description: "", ogImage: "" });
  }
}
