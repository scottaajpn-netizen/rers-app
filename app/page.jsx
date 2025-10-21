"use client";
import { useEffect, useMemo, useState } from "react";

const LS_KEY = "rers_fiches_v1";

function loadFiches() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveFiches(fiches) {
  localStorage.setItem(LS_KEY, JSON.stringify(fiches));
}

export default function Home() {
  const [fiches, setFiches] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [lines, setLines] = useState([]); // {type:'offer'|'request', text:''}

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null); // {id, firstName,lastName,phone,offers,requests}

  // charge
  useEffect(() => {
    setFiches(loadFiches());
  }, []);

  // derive
  const count = fiches.length;

  // helpers
  function addLine(type) {
    setLines((prev) => [...prev, { type, text: "" }]);
  }
  function updateLine(i, text) {
    setLines((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], text };
      return next;
    });
  }
  function removeLine(i) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function resetForm() {
    setFirstName("");
    setLastName("");
    setPhone("");
    setLines([]);
  }

  function handleCreate() {
    const offers = lines.filter(l => l.type === "offer" && l.text.trim()).map(l => l.text.trim());
    const requests = lines.filter(l => l.type === "request" && l.text.trim()).map(l => l.text.trim());
    if (!firstName.trim() && !lastName.trim()) return alert("Prénom ou nom requis.");
    const id = crypto.randomUUID();
    const fiche = { id, firstName:firstName.trim(), lastName:lastName.trim(), phone:phone.trim(), offers, requests, createdAt: Date.now() };
    const next = [fiche, ...fiches];
    setFiches(next);
    saveFiches(next);
    resetForm();
  }

  function handleDelete(id) {
    if (!confirm("Supprimer cette fiche ?")) return;
    const next = fiches.filter(f => f.id !== id);
    setFiches(next);
    saveFiches(next);
    if (editingId === id) { setEditingId(null); setEditData(null); }
  }

  // --- Edition ---
  function startEdit(f) {
    setEditingId(f.id);
    setEditData({
      ...f,
      offers: f.offers ?? [],
      requests: f.requests ?? []
    });
  }
  function updateEdit(field, value) {
    setEditData((prev) => ({ ...prev, [field]: value }));
  }
  function addEditItem(kind) {
    setEditData(prev => ({ ...prev, [kind]: [...(prev[kind] || []), ""] }));
  }
  function updateEditItem(kind, idx, val) {
    setEditData(prev => {
      const arr = [...(prev[kind] || [])];
      arr[idx] = val;
      return { ...prev, [kind]: arr };
    });
  }
  function removeEditItem(kind, idx) {
    setEditData(prev => {
      const arr = [...(prev[kind] || [])];
      arr.splice(idx, 1);
      return { ...prev, [kind]: arr };
    });
  }
  function cancelEdit() {
    setEditingId(null);
    setEditData(null);
  }
  function saveEdit() {
    if (!editData) return;
    const cleaned = {
      ...editData,
      firstName: (editData.firstName || "").trim(),
      lastName: (editData.lastName || "").trim(),
      phone: (editData.phone || "").trim(),
      offers: (editData.offers || []).map(s => s.trim()).filter(Boolean),
      requests: (editData.requests || []).map(s => s.trim()).filter(Boolean),
      updatedAt: Date.now(),
    };
    const idx = fiches.findIndex(f => f.id === editingId);
    if (idx === -1) return;
    const next = [...fiches];
    next[idx] = { ...next[idx], ...cleaned };
    setFiches(next);
    saveFiches(next);
    cancelEdit();
  }

  // export / import / reload
  function exportJSON() {
    const blob = new Blob([JSON.stringify(fiches, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rers_fiches_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function reloadFromStorage() {
    setFiches(loadFiches());
  }
  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error("format inattendu");
        saveFiches(parsed);
        setFiches(parsed);
        alert("Import réussi ✅");
      } catch (err) {
        alert("Import invalide : " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // reset input
  }

  return (
    <main style={{ maxWidth: 960, margin: "24px auto", padding: 16 }}>
      <h1>RERS</h1>
      <p>Annuaire — échanges de savoirs</p>

      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0 24px" }}>
        <button onClick={reloadFromStorage}>Recharger</button>
        <button onClick={exportJSON}>Exporter</button>
        <label style={{ display:"inline-flex", alignItems:"center", gap:8 }}>
          <span>Importer</span>
          <input type="file" accept="application/json" onChange={handleImport} />
        </label>
        <span style={{ marginLeft: "auto" }}>{count} fiche{count>1?"s":""}</span>
      </div>

      <section style={{ borderTop: "1px solid #ddd", paddingTop: 12, marginTop: 12 }}>
        <h2>Ajouter une fiche</h2>
        <p>Nom + une ou plusieurs lignes Offre/Demande.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label>Prénom</label>
            <input value={firstName} onChange={e=>setFirstName(e.target.value)} style={{ width:"100%" }} />
          </div>
          <div>
            <label>Nom</label>
            <input value={lastName} onChange={e=>setLastName(e.target.value)} style={{ width:"100%" }} />
          </div>
          <div style={{ gridColumn: "1 / span 2" }}>
            <label>Téléphone</label>
            <input value={phone} onChange={e=>setPhone(e.target.value)} style={{ width:"100%" }} />
          </div>
        </div>

        <h3 style={{ marginTop: 12 }}>Offres / Demandes</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button type="button" onClick={() => addLine("offer")}>+ Ajouter une offre</button>
          <button type="button" onClick={() => addLine("request")}>+ Ajouter une demande</button>
        </div>

        {lines.map((l, i) => (
          <div key={i} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
            <span style={{ minWidth: 90, fontSize: 12, opacity: .7 }}>{l.type === "offer" ? "Offre" : "Demande"}</span>
            <input
              value={l.text}
              onChange={(e)=>updateLine(i, e.target.value)}
              style={{ flex: 1 }}
              placeholder={l.type === "offer" ? "ex: Cours couture débutant" : "ex: Aide CV" }
            />
            <button type="button" onClick={() => removeLine(i)}>Supprimer</button>
          </div>
        ))}

        <div style={{ marginTop: 12 }}>
          <button onClick={handleCreate}>Enregistrer</button>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Liste des fiches</h2>
        {fiches.length === 0 ? (
          <p>Aucun résultat.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign:"left", borderBottom:"1px solid #eee", padding:"6px 0" }}>Nom</th>
                <th style={{ textAlign:"left", borderBottom:"1px solid #eee", padding:"6px 0" }}>Téléphone</th>
                <th style={{ textAlign:"left", borderBottom:"1px solid #eee", padding:"6px 0" }}>Offres</th>
                <th style={{ textAlign:"left", borderBottom:"1px solid #eee", padding:"6px 0" }}>Demandes</th>
                <th style={{ borderBottom:"1px solid #eee" }}></th>
              </tr>
            </thead>
            <tbody>
              {fiches.map((f) => (
                <tr key={f.id}>
                  <td style={{ padding:"8px 0" }}>{f.firstName} {f.lastName}</td>
                  <td style={{ padding:"8px 0" }}>{f.phone}</td>
                  <td style={{ padding:"8px 0" }}>{(f.offers||[]).join(", ")}</td>
                  <td style={{ padding:"8px 0" }}>{(f.requests||[]).join(", ")}</td>
                  <td style={{ padding:"8px 0", whiteSpace:"nowrap" }}>
                    <button onClick={() => startEdit(f)}>Éditer</button>{" "}
                    <button onClick={() => handleDelete(f.id)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p style={{ marginTop: 8, fontSize: 12, opacity: .7 }}>
          Pense à exporter régulièrement (sauvegarde locale).
        </p>
      </section>

      {/* ÉDITEUR : panneau simple en dessous (sans modal) */}
      {editingId && editData && (
        <section style={{ marginTop: 32, borderTop:"1px solid #ddd", paddingTop: 16 }}>
          <h2>Modifier la fiche</h2>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12 }}>
            <div>
              <label>Prénom</label>
              <input value={editData.firstName} onChange={e=>updateEdit("firstName", e.target.value)} style={{ width:"100%" }} />
            </div>
            <div>
              <label>Nom</label>
              <input value={editData.lastName} onChange={e=>updateEdit("lastName", e.target.value)} style={{ width:"100%" }} />
            </div>
            <div style={{ gridColumn:"1 / span 2" }}>
              <label>Téléphone</label>
              <input value={editData.phone} onChange={e=>updateEdit("phone", e.target.value)} style={{ width:"100%" }} />
            </div>
          </div>

          <h3 style={{ marginTop: 12 }}>Offres</h3>
          <button type="button" onClick={()=>addEditItem("offers")}>+ Ajouter une offre</button>
          <ul style={{ marginTop: 8 }}>
            {(editData.offers||[]).map((t, i) => (
              <li key={i} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
                <input value={t} onChange={e=>updateEditItem("offers", i, e.target.value)} style={{ flex:1 }} />
                <button type="button" onClick={()=>removeEditItem("offers", i)}>Supprimer</button>
              </li>
            ))}
          </ul>

          <h3>Demandes</h3>
          <button type="button" onClick={()=>addEditItem("requests")}>+ Ajouter une demande</button>
          <ul style={{ marginTop: 8 }}>
            {(editData.requests||[]).map((t, i) => (
              <li key={i} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
                <input value={t} onChange={e=>updateEditItem("requests", i, e.target.value)} style={{ flex:1 }} />
                <button type="button" onClick={()=>removeEditItem("requests", i)}>Supprimer</button>
              </li>
            ))}
          </ul>

          <div style={{ display:"flex", gap:8, marginTop: 12 }}>
            <button onClick={saveEdit}>Enregistrer les modifications</button>
            <button onClick={cancelEdit}>Annuler</button>
          </div>
        </section>
      )}
    </main>
  );
}
