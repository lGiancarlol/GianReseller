interface BadgeProps {
  variant: "active" | "inactive" | "type";
  children: React.ReactNode;
}

const styles: Record<BadgeProps["variant"], React.CSSProperties> = {
  active: {
    background: "rgba(34,197,94,0.1)",
    color: "#22c55e",
    border: "1px solid rgba(34,197,94,0.2)",
  },
  inactive: {
    background: "rgba(160,160,160,0.1)",
    color: "var(--text-muted)",
    border: "1px solid var(--border)",
  },
  type: {
    background: "rgba(193,18,31,0.1)",
    color: "var(--primary-hover)",
    border: "1px solid rgba(193,18,31,0.2)",
  },
};

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      style={{
        ...styles[variant],
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: "0.72rem",
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
}
