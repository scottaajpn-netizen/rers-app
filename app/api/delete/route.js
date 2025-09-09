import { list, put } from "@vercel/blob";

export const runtime = "edge";
const KEY = "rers/data.json";

function checkAuth(req: Request) {
  const token = req.headers.get("x-admin-token") || "";
  const expected = process.env.ADMIN_PASSWORD || "";
  return token && expected && token === expected;
}

async function readAll() {
  const { blobs } = await list({ prefix: KEY });
  if (!blobs.length) return [];
  const url = blobs[0].url;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json().catch(() => []);
  return Array.isArray(json) ? json : (json.entries ?? []);
}

export async function POST(req: Request) {
  if (!checkAuth(req)) return new Response("Unauthorized", { status: 401 });
  const { id } = await req.json();
  if (!id) return new Response("id requis", { status: 400 });

  const entries = await readAll();
  const next = entries.filter((e: any) => e.id !== id);

  await put(KEY, JSON.stringify(next), {
    contentType: "application/json",
    access: "public",
  });

  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
}
