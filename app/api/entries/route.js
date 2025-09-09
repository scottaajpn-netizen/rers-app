import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const KEY = "rers/data.json";
const ADMIN_TOKEN = "87800"; // mot de passe en dur (demandé)

async function readStore() {
  // Cherche le blob
  const { blobs } = await list({ prefix: KEY });
  const hit = blobs.find(b => b.pathname === KEY);
  if (!hit) {
    return { entries: [] };
  }
  const res = await fetch(hit.url, { cache: "no-store" });
  if (!res.ok) return { entries: [] };
  return await res.json();
}

async function writeStore(obj) {
  await put(KEY, JSON.stringify(obj, null, 2), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json"
  });
}

function isAdmin(req) {
  return (req.headers.get("x-admin-token") || "") === ADMIN_TOKEN;
}

export async function GET() {
  try {
    const data = await readStore();
    return NextResponse.json({ entries: data.entries || [] }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Erreur lecture" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const body = await req.json();
    const required = ["firstName", "lastName", "phone", "type", "skills"];
    for (const k of required) {
      if (!String(body?.[k] || "").trim()) {
        return NextResponse.json({ error: `Champ manquant: ${k}` }, { status: 400 });
      }
    }
    const entry = {
      id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 7),
      firstName: String(body.firstName).trim(),
      lastName: String(body.lastName).trim(),
      phone: String(body.phone).trim(),
      type: String(body.type).toLowerCase() === "offre" ? "offre" : "demande",
      skills: String(body.skills).trim(),
      createdAt: new Date().toISOString()
    };

    const data = await readStore();
    data.entries = Array.isArray(data.entries) ? data.entries : [];
    data.entries.unshift(entry);
    await writeStore(data);

    return NextResponse.json({ entry }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Erreur ajout" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });

    const data = await readStore();
    const before = data.entries?.length || 0;
    data.entries = (data.entries || []).filter(e => e.id !== id);
    if (data.entries.length === before) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }
    await writeStore(data);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Erreur suppression" }, { status: 500 });
  }
}
