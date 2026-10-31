import { mazeApiPost, mazeApiUrl } from "./mazeApi";

/** The site only sends settings and shows what comes back; paths are relative to the API's version prefix. */
export async function apiJson<T>(path: string, body: unknown): Promise<T> {
  return (await mazeApiPost(path, body)).json() as Promise<T>;
}

export async function apiPdf(path: string, body: unknown): Promise<Uint8Array> {
  return new Uint8Array(await (await mazeApiPost(path, body, "application/pdf")).arrayBuffer());
}

export async function apiGetJson<T>(path: string): Promise<T> {
  const response = await fetch(mazeApiUrl(path));
  if (!response.ok) throw new Error(`API returned ${response.status}`);
  return response.json() as Promise<T>;
}
