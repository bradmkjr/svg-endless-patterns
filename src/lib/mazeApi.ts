/** The version in every API path. The API names the same one in `src/version.ts`. */
export const API_VERSION = "v1.0.3";

export function mazeApiUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").replace(/\/+$/, "");
  return `${base}/api/${API_VERSION}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Keys in one order, so the same settings always make the same URL, and so the same cache entry. */
function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([key, item]) => [key, sorted(item)]));
}

/** Settings as the API reads them, one parameter each: a string as it is, and anything else as JSON. */
export function encodeSettings(settings: unknown): string {
  const entries = Object.entries(sorted(settings) as Record<string, unknown>).filter(([, value]) => value !== undefined);
  return new URLSearchParams(entries.map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)])).toString();
}

export async function mazeApiGet(path: string, settings: unknown, accept = "application/json"): Promise<Response> {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(mazeApiUrl(`${path}${separator}${encodeSettings(settings)}`), { headers: { accept } });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Maze API returned ${response.status}: ${detail || response.statusText}`);
  }
  return response;
}
