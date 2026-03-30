import { NextResponse } from "next/server";
import { TEMPLATE_KEYS, type TemplateKey } from "@/components/restaurant-templates/types";

const INTERNAL_API_URL = process.env.INTERNAL_API_URL || "http://localhost:8001";

type TemplateSelectionPayload = {
  stateSlug?: string;
  citySlug?: string;
  restaurantSlug?: string;
  templateKey?: string;
};

function isTemplateKey(value: string): value is TemplateKey {
  return TEMPLATE_KEYS.includes(value as TemplateKey);
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export async function POST(request: Request) {
  let body: TemplateSelectionPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid request body." }, { status: 400 });
  }

  const stateSlug = body.stateSlug?.trim().toLowerCase() || "";
  const citySlug = body.citySlug?.trim().toLowerCase() || "";
  const restaurantSlug = body.restaurantSlug?.trim().toLowerCase() || "";
  const templateKey = body.templateKey?.trim().toLowerCase() || "";

  if (!stateSlug || !citySlug || !restaurantSlug || !isTemplateKey(templateKey)) {
    return NextResponse.json(
      { detail: "stateSlug, citySlug, restaurantSlug, and templateKey are required." },
      { status: 400 }
    );
  }

  if (!process.env.ADMIN_TOKEN) {
    return NextResponse.json(
      { detail: "Template saving is disabled. Set ADMIN_TOKEN for web/api and restart." },
      { status: 503 }
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Admin-Token": process.env.ADMIN_TOKEN,
  };

  const upstream = await fetch(
    `${normalizeBaseUrl(INTERNAL_API_URL)}/admin/menus/${stateSlug}/${citySlug}/${restaurantSlug}/template`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({ template_key: templateKey }),
      cache: "no-store",
    }
  );

  const text = await upstream.text();
  if (!upstream.ok) {
    let detail = text || "Unable to save template.";
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed.detail === "string") {
        detail = parsed.detail;
      }
    } catch {
      // Keep text detail when response is not JSON.
    }
    return NextResponse.json(
      { detail },
      { status: upstream.status }
    );
  }

  return new NextResponse(text, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
