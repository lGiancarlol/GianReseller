interface FieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
}

export const fieldInput: React.CSSProperties = {
  width: "100%",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "0.55rem 0.75rem",
  color: "var(--text)",
  fontSize: "0.875rem",
  outline: "none",
};

export const fieldSelect: React.CSSProperties = {
  ...fieldInput,
  cursor: "pointer",
};

export default function Field({ label, children, hint }: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{label}</label>
      {children}
      {hint && (
        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{hint}</span>
      )}
    </div>
  );
}
