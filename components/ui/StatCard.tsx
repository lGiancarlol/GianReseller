interface StatCardProps {
  label: string;
  value: number | string;
}

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "1.25rem 1.5rem",
      }}
    >
      <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text)" }}>
        {value}
      </p>
    </div>
  );
}
