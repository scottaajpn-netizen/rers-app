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

    const body = await req.json();
    const required = ["nom", "prenom", "telephone", "type", "competences"];
    for (const k of required) {
      if (typeof body[k] !== "string" || !body[k].trim()) {
        return new Response("Missing field: " + k, { status: 400 });
      }
    }

    const item = {
      id: crypto.randomUUID(),
      nom: body.nom.trim(),
      prenom: body.prenom.trim(),
      telephone: body.telephone.trim(),
      type: body.type.trim(),          // "offre" | "demande"
      competences: body.competences.trim(),
      createdAt: Date.now()
    };

    const data = await readJSON();
    data.push(item);

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const res = await put(KEY, blob, {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });

    return Response.json({ ok: true, url: res.url, item });
  } catch (e) {
    return new Response("error add: " + String(e), { status: 500 });
  }
}
