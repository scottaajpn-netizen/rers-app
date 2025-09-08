export const metadata = { title: 'RERS' };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, background: '#f7f7f7' }}>
        {children}
      </body>
    </html>
  );
}
