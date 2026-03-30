const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL || "http://localhost:8001";
const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export class ApiError extends Error {
  status: number;

  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function normalizeBaseUrl(rawUrl: string): string {
  return rawUrl.trim().replace(/\/+$/, "");
}

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "/";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function getBaseUrl(): string {
  if (typeof window === "undefined") {
    return normalizeBaseUrl(INTERNAL_API_URL);
  }
  return normalizeBaseUrl(PUBLIC_API_URL);
}

async function parseApiError(res: Response): Promise<string> {
  const fallback = `API error: ${res.status} ${res.statusText}`;
  const text = await res.text();
  if (!text) return fallback;

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.detail === "string" && parsed.detail.trim()) {
      return parsed.detail.trim();
    }
  } catch {
    // Keep raw text detail when response is not JSON.
  }

  return text.trim() || fallback;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const normalizedPath = normalizePath(path);
  const url = normalizedPath.startsWith("http")
    ? normalizedPath
    : `${getBaseUrl()}${normalizedPath}`;
  const res = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    throw new ApiError(res.status, await parseApiError(res));
  }
  return res.json();
}
