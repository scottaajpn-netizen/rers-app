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

  const body = await req.json();
  const nom = (body.nom || "").trim();
  const telephone = (body.telephone || "").trim();
  const type = body.type === "Demande" ? "Demande" : "Offre";
  const competences = (body.competences || "").trim();

  if (!nom || !telephone || !competences) return new Response("Champs manquants", { status: 400 });

  const entries = await readAll();
  const entry = {
    id: crypto.randomUUID(),
    nom,
    telephone,
    type,
    competences,
    createdAt: new Date().toISOString()
  };
  entries.unshift(entry);

  await put(KEY, JSON.stringify(entries), {
    contentType: "application/json",
    access: "public", // public pour lecture facile via URL interne
  });

  return new Response(JSON.stringify({ ok: true, entry }), { headers: { "content-type": "application/json" } });
}
