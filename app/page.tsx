"use client";

import { useEffect, useState } from "react";

const empty = () => ({
  nom: "",
  prenom: "",
  telephone: "",
  type: "offre",
  competences: ""
});

export default function Home() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const r = await fetch("/api/entries", { cache: "no-store" });
    const data = await r.json();
    setItems(data);
  }

  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error(await res.text());
      setForm(empty());
      await load();
    } catch (err) {
      setError("Erreur ajout : " + (err?.message || "Inconnue"));
    } finally {
      setLoading(false);
    }
  }

  async function remove(id) {
    if (!confirm("Supprimer cette entrée ?")) return;
    const res = await fetch("/api/entries?id=" + id, { method: "DELETE" });
    if (res.ok) load();
    else alert("Suppression impossible");
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px" }}>
      <h1>Réseau d’Échanges Réciproques de Savoirs</h1>

      <form onSubmit={add}
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "repeat(6, 1fr)",
          background: "#fff",
          padding: 16,
          borderRadius: 12,
          boxShadow: "0 1px 4px rgba(0,0,0,.08)"
        }}>
        <input required placeholder="Nom" value={form.nom}
          onChange={e => setForm({ ...form, nom: e.target.value })} style={{ gridColumn: "span 2" }} />
        <input required placeholder="Prénom" value={form.prenom}
          onChange={e => setForm({ ...form, prenom: e.target.value })} style={{ gridColumn: "span 2" }} />
        <input required placeholder="Téléphone" value={form.telephone}
          onChange={e => setForm({ ...form, telephone: e.target.value })} style={{ gridColumn: "span 2" }} />
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
          <option value="offre">Offre</option>
          <option value="demande">Demande</option>
        </select>
        <input required placeholder="Compétences / sujet" value={form.competences}
          onChange={e => setForm({ ...form, competences: e.target.value })} style={{ gridColumn: "span 5" }} />
        <button disabled={loading} style={{ gridColumn: "span 6", padding: 10 }}>
          {loading ? "Envoi…" : "Ajouter"}
        </button>
        {error && <p style={{ color: "crimson", gridColumn: "span 6" }}>{error}</p>}
      </form>

      <div style={{ marginTop: 24, background: "#fff", borderRadius: 12, padding: 12, boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Nom</th><th>Prénom</th><th>Téléphone</th><th>Type</th><th>Compétences</th><th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id} style={{ borderTop: "1px solid #eee" }}>
                <td>{it.nom}</td>
                <td>{it.prenom}</td>
                <td><a href={`tel:${it.telephone}`}>{it.telephone}</a></td>
                <td>{it.type}</td>
                <td>{it.competences}</td>
                <td><button onClick={() => remove(it.id)}>Supprimer</button></td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 16 }}>Aucune entrée pour le moment.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
