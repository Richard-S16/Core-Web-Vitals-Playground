import { NextRequest, NextResponse } from "next/server";

const PSI_API_URL =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

const _rateStore = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = _rateStore.get(ip);
  if (!entry || now > entry.resetAt) {
    _rateStore.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

function isValidUrl(input: string): boolean {
  try {
    const parsed = new URL(input);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function isPrivateUrl(input: string): boolean {
  try {
    const parsed = new URL(input);
    const hostname = parsed.hostname;

    const host =
      hostname.startsWith("[") && hostname.endsWith("]")
        ? hostname.slice(1, -1)
        : hostname;

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      return true;

    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host === "0:0:0:0:0:0:0:1" ||
      host === "0:0:0:0:0:0:0:0"
    )
      return true;

    if (/^::ffff:127\./i.test(host)) return true;
    if (/^::ffff:0*7f/i.test(host)) return true;

    if (/^\d+$/.test(host) || /^0x[\da-f]+$/i.test(host)) return true;

    if (host.startsWith("10.")) return true;
    if (host.startsWith("192.168.")) return true;
    if (host.startsWith("172.")) {
      const second = parseInt(host.split(".")[1], 10);
      if (second >= 16 && second <= 31) return true;
    }

    if (host.startsWith("169.254.")) return true;

    if (host.startsWith("100.64.")) return true;
    if (host.startsWith("198.51.100.")) return true;
    if (host.startsWith("203.0.113.")) return true;
    if (host.startsWith("240.")) return true;
    if (host === "255.255.255.255") return true;

    if (
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host.endsWith(".localhost")
    )
      return true;

    return false;
  } catch {
    return true;
  }
}

function sanitizeUpstreamError(status: number, upstreamMessage?: string): string {
  if (status === 400)
    return "The URL could not be analyzed. Please check it and try again.";
  if (status === 429) return "Analysis quota exceeded. Please try again later.";
  if (status === 503)
    return "The PageSpeed Insights service is temporarily unavailable.";
  console.error("[PSI upstream error]", status, upstreamMessage);
  return "Analysis failed. Please try again.";
}

const ALLOWED_PSI_FIELDS = [
  "id",
  "loadingExperience",
  "originLoadingExperience",
  "lighthouseResult",
  "analysisUTCTimestamp",
] as const;

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "anonymous";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before retrying." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { url, strategy } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: "Invalid URL. Must start with http:// or https://" },
        { status: 400 }
      );
    }

    if (isPrivateUrl(url)) {
      console.warn(
        JSON.stringify({
          event: "SSRF_BLOCKED",
          url,
          ip,
          timestamp: new Date().toISOString(),
        })
      );
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
      const message = sanitizeUpstreamError(
        response.status,
        errorData?.error?.message
      );
      return NextResponse.json(
        { error: message },
        {
          status: response.status,
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        }
      );
    }

    const data = await response.json();

    const filtered = Object.fromEntries(
      ALLOWED_PSI_FIELDS.filter((k) => k in data).map((k) => [k, data[k]])
    );

    return NextResponse.json(filtered, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request to PageSpeed Insights timed out" },
        { status: 504, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }
}
