const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL || "http://localhost:8001";
const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

function getBaseUrl(): string {
  if (typeof window === "undefined") {
    return INTERNAL_API_URL;
  }
  return PUBLIC_API_URL;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
