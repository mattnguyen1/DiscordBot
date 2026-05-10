export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const text = await response.text();

  let body: unknown = undefined;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    const message = extractErrorMessage(body) || `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return body as T;
}

export function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return typeof body === "string" ? body : null;
  const value = body as Record<string, unknown>;
  if (typeof value.message === "string") return value.message;
  if (typeof value.detail === "string") return value.detail;
  if (typeof value.error === "string") return value.error;
  if (value.error && typeof value.error === "object") {
    const error = value.error as Record<string, unknown>;
    if (typeof error.message === "string") return error.message;
  }
  return null;
}

export function truncateForDiscord(text: string, max = 1900): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 15)}\n…[truncated]`;
}
