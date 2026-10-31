/** The version in every API path. The API names the same one in `src/version.ts`. */
export const API_VERSION = "v1.0.1";

export function mazeApiUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").replace(/\/+$/, "");
  return `${base}/api/${API_VERSION}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function mazeApiPost(path: string, body: unknown, accept = "application/json"): Promise<Response> {
  const response = await fetch(mazeApiUrl(path), {
    method: "POST",
    headers: { "content-type": "application/json", accept },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Maze API returned ${response.status}: ${detail || response.statusText}`);
  }
  return response;
}
