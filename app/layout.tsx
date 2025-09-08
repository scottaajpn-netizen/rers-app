export const metadata = { title: "RERS — Réseau d’échanges", description: "Offres & Demandes" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "Inter, system-ui, sans-serif", margin: 0, background: "#f7f7f7" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>{children}</div>
      </body>
    </html>
  );
}
