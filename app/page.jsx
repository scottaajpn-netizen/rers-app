"use client";

import { useEffect, useMemo, useState } from "react";

// Mot de passe admin utilisé dans l'en-tête de la requête POST
const ADMIN_TOKEN = "87800";

export default function Page() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | offre | demande

  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    telephone: "",
    type: "offre",
    competences: "",
  });

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (filterType !== "all" && e.type !== filterType) return false;
      if (!q) return true;
      const hay =
        `${e.prenom ?? ""} ${e.nom ?? ""} ${e.telephone ?? ""} ${e.type ?? ""} ${
          e.competences ?? ""
        }`.toLowerCase();
      return hay.includes(q);
    });
  }, [entries, search, filterType]);

  async function loadEntries() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/entries", { cache: "no-store" });
      let data = [];
      try {
        data = await res.json();
      } catch {}
      if (!res.ok)
        throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Erreur chargement : " + (err?.message || "inconnue"));
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!form.prenom?.trim() || !form.nom?.trim()) {
      setSaving(false);
      setError("Veuillez saisir au minimum prénom et nom.");
      return;
    }
    if (!["offre", "demande"].includes(form.type)) {
      setSaving(false);
      setError('Le type doit être "offre" ou "demande".');
      return;
    }

    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-token": ADMIN_TOKEN, // <= intégré ici
        },
        body: JSON.stringify({
          prenom: form.prenom.trim(),
          nom: form.nom.trim(),
          telephone: form.telephone.trim(),
          type: form.type,
          competences: form.competences.trim(),
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {}

      if (!res.ok)
        throw new Error(data?.error || data?.message || `HTTP ${res.status}`);

      setForm({
        prenom: "",
        nom: "",
        telephone: "",
        type: "offre",
        competences: "",
      });
      await loadEntries();
    } catch (err) {
      setError("Erreur ajout : " + (err?.message || "inconnue"));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadEntries();
  }, []);

  return (
    <div style={{ maxWidth: 980, margin: "32px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>
        Réseau d’Échanges Réciproques de Savoirs (RERS)
      </h1>

      {error ? (
        <div
          style={{
            background: "#ffe8e8",
            border: "1px solid #ffb3b3",
            color: "#7a0000",
            padding: 12,
            borderRadius: 8,
            marginBottom: 20,
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </div>
      ) : null}

      <form
        onSubmit={handleAdd}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          border: "1px solid #eee",
          padding: 16,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <div>
          <label style={labelStyle}>Prénom</label>
          <input
            name="prenom"
            value={form.prenom}
            onChange={onChange}
            style={inputStyle}
            required
          />
        </div>
        <div>
          <label style={labelStyle}>Nom</label>
          <input
            name="nom"
            value={form.nom}
            onChange={onChange}
            style={inputStyle}
            required
          />
        </div>
        <div>
          <label style={labelStyle}>Téléphone</label>
          <input
            name="telephone"
            value={form.telephone}
            onChange={onChange}
            style={inputStyle}
            placeholder="06…"
          />
        </div>
        <div>
          <label style={labelStyle}>Type</label>
          <select
            name="type"
            value={form.type}
            onChange={onChange}
            style={inputStyle}
          >
            <option value="offre">Offre</option>
            <option value="demande">Demande</option>
          </select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Compétences / Détails</label>
          <textarea
            name="competences"
            value={form.competences}
            onChange={onChange}
            style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
            placeholder="Ex: jardinage, couture, aide administrative…"
          />
        </div>
        <div style={{ gridColumn: "1 / -1", textAlign: "right" }}>
          <button
            disabled={saving}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid #333",
              background: saving ? "#eee" : "#111",
              color: saving ? "#111" : "#fff",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Ajout en cours…" : "Ajouter l’entrée"}
          </button>
        </div>
      </form>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <input
          placeholder="Rechercher (nom, téléphone, compétences…)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 260 }}
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={inputStyle}
        >
          <option value="all">Tous</option>
          <option value="offre">Offres</option>
          <option value="demande">Demandes</option>
        </select>
        <button
          onClick={loadEntries}
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: "#fafafa",
            cursor: "pointer",
          }}
          type="button"
        >
          {loading ? "Chargement…" : "Recharger"}
        </button>
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <Th>Prénom</Th>
              <Th>Nom</Th>
              <Th>Téléphone</Th>
              <Th>Type</Th>
              <Th>Compétences</Th>
              <Th>Créé le</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#666" }}>
                  {loading ? "Chargement…" : "Aucune entrée"}
                </td>
              </tr>
            ) : (
              filtered
                .slice()
                .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
                .map((e) => (
                  <tr key={e.id || `${e.prenom}-${e.nom}-${e.telephone}`}>
                    <Td>{e.prenom}</Td>
                    <Td>{e.nom}</Td>
                    <Td>{e.telephone}</Td>
                    <Td style={{ textTransform: "capitalize" }}>{e.type}</Td>
                    <Td>{e.competences}</Td>
                    <Td>{e.createdAt ? new Date(e.createdAt).toLocaleString() : ""}</Td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      <p style={{ color: "#999", fontSize: 12, marginTop: 10 }}>
        (Pour aller vite, le mot de passe admin est intégré côté client. Toute
        personne ayant accès à la page peut techniquement le voir.)
      </p>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 12, color: "#555", marginBottom: 4 };

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ddd",
  borderRadius: 8,
  outline: "none",
  background: "#fff",
};

function Th({ children }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: 12,
        borderBottom: "1px solid #eee",
        fontWeight: 600,
        fontSize: 14,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, style }) {
  return (
    <td
      style={{
        padding: 12,
        borderBottom: "1px solid #f2f2f2",
        verticalAlign: "top",
        ...style,
      }}
    >
      {children}
    </td>
  );
}
