export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      {children}
    </main>
  );
}
