import { list } from "@vercel/blob";

export const runtime = "edge";
const KEY = "rers/data.json";

async function readJSON() {
  const files = await list({ prefix: KEY });
  const file = files.blobs.find((b) => b.pathname === KEY);
  if (!file) return [];
  const res = await fetch(file.url, { cache: "no-store" });
  return await res.json();
}

export async function GET() {
  try {
    const data = await readJSON();
    return Response.json({ ok: true, data });
  } catch (e) {
    return new Response("error list: " + String(e), { status: 500 });
  }
}
