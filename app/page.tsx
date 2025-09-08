"use client";

import { useEffect, useMemo, useState } from "react";

type Entree = {
  id: string;
  nom: string;
  telephone: string;
  type: "Offre" | "Demande";
  competences: string;
  createdAt: string;
};

export default function Page() {
  const [data, setData] = useState<Entree[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Form
  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("");
  const [type, setType] = useState<"Offre" | "Demande">("Offre");
  const [comp, setComp] = useState("");

  useEffect(() => {
    reload();
    const saved = localStorage.getItem("rers_admin_token");
    if (saved) {
      setToken(saved);
      setIsEdit(true);
    }
  }, []);

  async function reload() {
    setLoading(true);
    const res = await fetch("/api/list", { cache: "no-store" });
    const json = await res.json();
    setData(json.entries || []);
    setLoading(false);
  }

  function askPassword() {
    const p = prompt("Mot de passe admin :");
    if (!p) return;
    localStorage.setItem("rers_admin_token", p);
    setToken(p);
    setIsEdit(true);
  }
  function stopEdit() {
    localStorage.removeItem("rers_admin_token");
    setToken(null);
    setIsEdit(false);
  }

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return alert("Active d’abord le mode Édition.");
    if (!nom.trim() || !tel.trim() || !comp.trim()) return alert("Remplis tous les champs.");
    const res = await fetch("/api/add", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ nom, telephone: tel, type, competences: comp })
    });
    if (!res.ok) {
      const t = await res.text();
      alert("Erreur ajout: " + t);
      return;
    }
    setNom(""); setTel(""); setComp("");
    await reload();
  }

  async function delEntry(id: string) {
    if (!token) return alert("Active d’abord le mode Édition.");
    if (!confirm("Supprimer cette entrée ?")) return;
    const res = await fetch("/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ id })
    });
    if (!res.ok) {
      const t = await res.text();
      alert("Erreur suppression: " + t);
      return;
    }
    await reload();
  }

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    if (!s) return data;
    return data.filter((e) =>
      [e.nom, e.telephone, e.type, e.competences].join(" ").toLowerCase().includes(s)
    );
  }, [q, data]);

  return (
    <main>
      <h1 style={{ marginBottom: 8 }}>RERS — Offres & Demandes</h1>
      <p style={{ color: "#555", marginTop: 0 }}>
        Filtre rapide, ajout/suppression en mode Édition (protégé par mot de passe).
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "12px 0 20px" }}>
        <input
          placeholder="Filtrer (nom, téléphone, type, compétence)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
        />
        {!isEdit ? (
          <button onClick={askPassword} style={btn()}>
            Activer l’édition
          </button>
        ) : (
          <button onClick={stopEdit} style={btn("ghost")}>
            Quitter l’édition
          </button>
        )}
      </div>

      {isEdit && (
        <form onSubmit={addEntry} style={card()}>
          <h3 style={{ marginTop: 0 }}>Ajouter une entrée</h3>
          <div style={grid()}>
            <div>
              <label>Nom / Prénom</label>
              <input value={nom} onChange={(e) => setNom(e.target.value)} style={input()} />
            </div>
            <div>
              <label>Téléphone</label>
              <input value={tel} onChange={(e) => setTel(e.target.value)} style={input()} />
            </div>
            <div>
              <label>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as any)} style={input()}>
                <option>Offre</option>
                <option>Demande</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label>Compétences</label>
              <input value={comp} onChange={(e) => setComp(e.target.value)} style={input()} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="submit" style={btn("primary")}>Ajouter</button>
          </div>
        </form>
      )}

      <div style={card()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <strong>{filtered.length} entrée(s)</strong>
          {loading && <span>Chargement…</span>}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th()}>Nom / Prénom</th>
                <th style={th()}>Téléphone</th>
                <th style={th()}>Type</th>
                <th style={th()}>Compétences</th>
                {isEdit && <th style={th()}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={td()}>{e.nom}</td>
                  <td style={td()}>{e.telephone}</td>
                  <td style={td()}>{e.type}</td>
                  <td style={td()}>{e.competences}</td>
                  {isEdit && (
                    <td style={td()}>
                      <button onClick={() => delEntry(e.id)} style={btn("danger", 6)}>Supprimer</button>
                    </td>
                  )}
                </tr>
              ))}
              {!filtered.length && !loading && (
                <tr><td colSpan={isEdit ? 5 : 4} style={{ padding: 16, textAlign: "center", color: "#666" }}>Aucune entrée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function card(): React.CSSProperties {
  return { background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.03)", marginBottom: 16 };
}
function grid(): React.CSSProperties {
  return { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignItems: "end" };
}
function input(): React.CSSProperties {
  return { width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" };
}
function th(): React.CSSProperties {
  return { textAlign: "left", padding: "10px 8px", fontWeight: 600, fontSize: 14, color: "#333" };
}
function td(): React.CSSProperties {
  return { padding: "10px 8px", fontSize: 14, verticalAlign: "top" };
}
function btn(kind: "primary" | "danger" | "ghost" | undefined = undefined, radius = 8): React.CSSProperties {
  const base: React.CSSProperties = { padding: "10px 14px", borderRadius: radius, border: "1px solid #ddd", background: "#fff", cursor: "pointer" };
  if (kind === "primary") return { ...base, background: "#111", color: "#fff", borderColor: "#111" };
  if (kind === "danger") return { ...base, background: "#fff3f3", borderColor: "#f3d1d1" };
  if (kind === "ghost") return { ...base, background: "#f6f6f6" };
  return base;
}
