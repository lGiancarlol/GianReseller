"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/providers", label: "Providers" },
  { href: "/dashboard/users", label: "Users" },
  { href: "/dashboard/resellers", label: "Resellers" },
  { href: "/dashboard/requests", label: "License Requests" },
  { href: "/dashboard/logs", label: "Logs" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 220,
        minHeight: "100vh",
        background: "var(--panel)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--primary)" }}>
          GianReseller
        </span>
      </div>

      <nav style={{ flex: 1, padding: "1rem 0" }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "block",
                padding: "0.55rem 1.5rem",
                fontSize: "0.875rem",
                color: active ? "var(--text)" : "var(--text-muted)",
                background: active ? "rgba(193,18,31,0.12)" : "transparent",
                borderLeft: active ? "2px solid var(--primary)" : "2px solid transparent",
                textDecoration: "none",
                transition: "all 0.15s",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)" }}>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            width: "100%",
            padding: "0.5rem",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
