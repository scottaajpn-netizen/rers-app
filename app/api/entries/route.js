import { list, put } from "@vercel/blob";

export const runtime = "edge";
const KEY = "rers/data.json";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function authorized(req) {
  const token = req.headers.get("x-admin-token") || "";
  const expected = process.env.ADMIN_PASSWORD || "";
  return token && expected && token === expected;
}

export async function GET() {
  try {
    const { blobs } = await list({ prefix: KEY });
    if (!blobs.length) return json([]);
    const res = await fetch(blobs[0].url);
    const data = await res.json().catch(() => []);
    return json(data);
  } catch (err) {
    console.error("GET /api/entries failed:", err);
    return json({ error: err?.message || "internal error" }, 500);
  }
}

export async function POST(req) {
  try {
    if (!authorized(req)) return json({ error: "unauthorized" }, 401);

    const raw = await req.text();
    console.log("POST /api/entries raw:", raw);
    let body;
    try { body = JSON.parse(raw || "{}"); }
    catch { return json({ error: "invalid JSON body" }, 400); }

    const { prenom, nom, telephone, type, competences } = body || {};
    if (!prenom || !nom) return json({ error: "prenom et nom requis" }, 400);
    if (!["offre", "demande"].includes(type))
      return json({ error: 'type doit être "offre" ou "demande"' }, 400);

    // charge l'existant
    const { blobs } = await list({ prefix: KEY });
    let arr = [];
    if (blobs.length) {
      const res = await fetch(blobs[0].url);
      arr = await res.json().catch(() => []);
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    arr.push({ id, prenom, nom, telephone, type, competences, createdAt });

    const { url } = await put(KEY, JSON.stringify(arr, null, 2), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });
    console.log("Blob written:", url);

    return json({ ok: true, id });
  } catch (err) {
    console.error("POST /api/entries failed:", err);
    return json({ error: err?.message || "internal error" }, 500);
  }
}
