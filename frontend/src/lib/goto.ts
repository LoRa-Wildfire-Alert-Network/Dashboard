const STORAGE_KEY = "lora_goto_url";

export function currentPath(): string {
  return window.location.pathname + window.location.search;
}

export function getGoto(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("goto") || sessionStorage.getItem(STORAGE_KEY);
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
