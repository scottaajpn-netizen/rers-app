import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GH_TOKEN = process.env.GH_TOKEN;
const GH_REPO = process.env.GH_REPO;        // ex: "tonUser/rers-data"
const GH_FILE_PATH = process.env.GH_FILE_PATH || "entries.json";
const GH_BRANCH = process.env.GH_BRANCH || "main";

function b64(str) {
  return Buffer.from(str, "utf8").toString("base64");
}
function fromB64(str) {
  return Buffer.from(str || "", "base64").toString("utf8");
}

async function getFile() {
  const url =
    `https://api.github.com/repos/${GH_REPO}/contents/${encodeURIComponent(GH_FILE_PATH)}?ref=${encodeURIComponent(GH_BRANCH)}`;
  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: "application/vnd.github+json"
    },
    cache: "no-store"
  });
  if (r.status === 404) return { entries: [], sha: undefined };
  if (!r.ok) throw new Error(`GitHub GET ${r.status}`);
  const j = await r.json();
  const entries = JSON.parse(fromB64(j.content || "W10=") || "[]");
  return { entries, sha: j.sha };
}

async function putFile(entries, sha) {
  const url = `https://api.github.com/repos/${GH_REPO}/contents/${encodeURIComponent(GH_FILE_PATH)}`;
  const body = {
    message: "rers: update entries",
    content: b64(JSON.stringify(entries, null, 2)),
    branch: GH_BRANCH,
    sha
  };
  const r = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: "application/vnd.github+json"
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`GitHub PUT ${r.status}`);
}

export async function GET() {
  try {
    const { entries } = await getFile();
    return NextResponse.json(entries, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return new NextResponse("Erreur lecture", { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const required = ["nom", "prenom", "telephone", "type", "competences"];
    if (!required.every(k => (data?.[k] || "").toString().trim())) {
      return new NextResponse("Champs manquants", { status: 400 });
    }
    const { entries, sha } = await getFile();
    const id = Date.now().toString();
    entries.push({ id, ...data });
    await putFile(entries, sha);
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch {
    return new NextResponse("Erreur ajout", { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return new NextResponse("id requis", { status: 400 });
    const { entries, sha } = await getFile();
    await putFile(entries.filter(e => e.id !== id), sha);
    return NextResponse.json({ ok: true });
  } catch {
    return new NextResponse("Erreur suppression", { status: 500 });
  }
}
