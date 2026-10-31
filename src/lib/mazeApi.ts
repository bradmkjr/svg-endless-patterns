export function mazeApiUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").replace(/\/+$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
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
