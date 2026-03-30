import { NextResponse } from "next/server";

const INTERNAL_API_URL = process.env.INTERNAL_API_URL || "http://localhost:8001";

type TestEmailPayload = {
  recipient?: string;
};

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export async function POST(request: Request) {
  let body: TestEmailPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid request body." }, { status: 400 });
  }

  const adminToken = process.env.ADMIN_TOKEN || process.env.NEXT_PUBLIC_ADMIN_TOKEN;

  if (!adminToken) {
    return NextResponse.json(
      { detail: "Admin email testing is disabled. Set ADMIN_TOKEN for web/api and restart." },
      { status: 503 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `${normalizeBaseUrl(INTERNAL_API_URL)}/admin/notifications/test-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken,
        },
        body: JSON.stringify({ recipient: body.recipient?.trim() || undefined }),
        cache: "no-store",
      }
    );
  } catch (error) {
    const detail =
      error instanceof Error && error.message
        ? `Admin email testing could not reach the API (${error.message}).`
        : "Admin email testing could not reach the API.";
    return NextResponse.json({ detail }, { status: 502 });
  }

  const text = await upstream.text();
  if (!upstream.ok) {
    let detail = text || "Unable to send test email.";
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed.detail === "string") {
        detail = parsed.detail;
      }
    } catch {
      // Keep text detail when response is not JSON.
    }
    return NextResponse.json({ detail }, { status: upstream.status });
  }

  return new NextResponse(text, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
