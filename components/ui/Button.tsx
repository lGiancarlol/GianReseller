interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
}

const base: React.CSSProperties = {
  border: "none",
  borderRadius: 6,
  fontWeight: 500,
  cursor: "pointer",
  transition: "background 0.15s",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const variants: Record<string, React.CSSProperties> = {
  primary: { background: "var(--primary)", color: "#fff" },
  secondary: { background: "var(--panel)", color: "var(--text)", border: "1px solid var(--border)" },
  danger: { background: "rgba(193,18,31,0.15)", color: "var(--primary-hover)", border: "1px solid rgba(193,18,31,0.3)" },
  ghost: { background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" },
};

const sizes: Record<string, React.CSSProperties> = {
  sm: { padding: "4px 12px", fontSize: "0.78rem" },
  md: { padding: "7px 16px", fontSize: "0.875rem" },
};

export default function Button({
  variant = "primary",
  size = "md",
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      style={{ ...base, ...variants[variant], ...sizes[size], ...style }}
      {...props}
    />
  );
}
