import { NextRequest, NextResponse } from "next/server";

const PSI_API_URL =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

function isValidUrl(input: string): boolean {
  try {
    const parsed = new URL(input);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

// Block requests to private/internal networks to prevent SSRF
function isPrivateUrl(input: string): boolean {
  try {
    const parsed = new URL(input);
    const hostname = parsed.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return true;
    }
    // Check 172.16.0.0/12 range
    if (hostname.startsWith("172.")) {
      const second = parseInt(hostname.split(".")[1], 10);
      if (second >= 16 && second <= 31) return true;
    }
    return false;
  } catch {
    return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, strategy } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: "Invalid URL. Must start with http:// or https://" },
        { status: 400 }
      );
    }

    if (isPrivateUrl(url)) {
      return NextResponse.json(
        { error: "URLs pointing to private/internal networks are not allowed" },
        { status: 400 }
      );
    }

    const validStrategy =
      strategy === "desktop" || strategy === "mobile" ? strategy : "mobile";

    const apiKey = process.env.PAGESPEED_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "PageSpeed Insights API key is not configured. Add PAGESPEED_API_KEY to your .env.local file.",
        },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      url,
      strategy: validStrategy,
      key: apiKey,
      category: "performance",
    });

    const response = await fetch(`${PSI_API_URL}?${params.toString()}`, {
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message =
        errorData?.error?.message || `PSI API returned ${response.status}`;
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request to PageSpeed Insights timed out" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
