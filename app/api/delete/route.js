import { list, put } from "@vercel/blob";

export const runtime = "edge";
const KEY = "rers/data.json";

function checkAuth(req) {
  const token = req.headers.get("x-admin-token") || "";
  const expected = process.env.ADMIN_PASSWORD || "";
  return token && expected && token === expected;
}

async function readJSON() {
  const files = await list({ prefix: KEY });
  const file = files.blobs.find((b) => b.pathname === KEY);
  if (!file) return [];
  const res = await fetch(file.url, { cache: "no-store" });
  return await res.json();
}

export async function POST(req) {
  try {
    if (!checkAuth(req)) return new Response("Unauthorized", { status: 401 });

    const { id } = await req.json();
    if (!id) return new Response("Missing id", { status: 400 });

    let data = await readJSON();
    const before = data.length;
    data = data.filter((x) => x.id !== id);
    if (data.length === before) return new Response("Not found", { status: 404 });

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const r = await put(KEY, blob, {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });

    return Response.json({ ok: true, url: r.url });
  } catch (e) {
    return new Response("error delete: " + String(e), { status: 500 });
  }
}
