const STORAGE_KEY = "lora_goto_url";

export function currentPath(): string {
  return window.location.pathname + window.location.search;
}

/**
 * Reject absolute URLs to foreign origins, javascript: URIs, and anything
 * that isn't a plain same-origin path.  Returns a safe path or null.
 */
function sanitizeGoto(raw: string | null): string | null {
  if (!raw) return null;

  if (raw.startsWith("/")) {
    // Block protocol-relative URLs (e.g. "//evil.com")
    if (raw.startsWith("//")) return null;
    return raw;
  }

  try {
    const parsed = new URL(raw, window.location.origin);
    if (parsed.origin !== window.location.origin) return null;
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return null;
  }
}

/** Read goto target from URL param first, then sessionStorage. Sanitized to same-origin paths. */
export function getGoto(): string | null {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("goto") || sessionStorage.getItem(STORAGE_KEY);
  return sanitizeGoto(raw);
}

export function storeGoto(path: string = currentPath()) {
  sessionStorage.setItem(STORAGE_KEY, path);
}

export function clearGoto() {
  sessionStorage.removeItem(STORAGE_KEY);
  const params = new URLSearchParams(window.location.search);
  if (params.has("goto")) {
    params.delete("goto");
    const qs = params.toString();
    const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState({}, "", next);
  }
}

export function withGoto(base: string, goto: string = currentPath()): string {
  const url = new URL(base, window.location.origin);
  url.searchParams.set("goto", goto);
  return url.pathname + url.search;
}
