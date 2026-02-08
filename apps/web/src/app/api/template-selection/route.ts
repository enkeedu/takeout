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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (process.env.ADMIN_TOKEN) {
    headers["X-Admin-Token"] = process.env.ADMIN_TOKEN;
  }

  const upstream = await fetch(
    `${INTERNAL_API_URL}/admin/menus/${stateSlug}/${citySlug}/${restaurantSlug}/template`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({ template_key: templateKey }),
      cache: "no-store",
    }
  );

  const text = await upstream.text();
  if (!upstream.ok) {
    return NextResponse.json(
      { detail: text || "Unable to save template." },
      { status: upstream.status }
    );
  }

  return new NextResponse(text, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
