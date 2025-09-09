import { list } from "@vercel/blob";

export const runtime = "edge";

const KEY = "rers/data.json";

async function readAll() {
  const { blobs } = await list({ prefix: KEY });
  if (!blobs.length) return [];
  const url = blobs[0].url;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json().catch(() => []);
  return Array.isArray(json) ? json : (json.entries ?? []);
}

export async function GET() {
  const entries = await readAll();
  return new Response(JSON.stringify({ entries }), { headers: { "content-type": "application/json" } });
}
