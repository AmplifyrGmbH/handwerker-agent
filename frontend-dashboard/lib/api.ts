const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8002";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

export function wsUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8002")
    .replace(/^https/, "wss")
    .replace(/^http/, "ws");
  return `${base}${path}`;
}
