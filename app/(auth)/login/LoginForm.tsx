"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Credenciales inválidas.");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 380 }}>
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "2rem",
        }}
      >
        <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)" }}>
            GianReseller
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: 4 }}>
            Accede a tu panel
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              style={{
                width: "100%",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "0.6rem 0.75rem",
                color: "var(--text)",
                fontSize: "0.875rem",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              style={{
                width: "100%",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "0.6rem 0.75rem",
                color: "var(--text)",
                fontSize: "0.875rem",
                outline: "none",
              }}
            />
          </div>

          {error && (
            <p style={{ color: "var(--primary-hover)", fontSize: "0.8rem", textAlign: "center" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? "var(--border)" : "var(--primary)",
              color: "var(--text)",
              border: "none",
              borderRadius: 6,
              padding: "0.65rem",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.15s",
              marginTop: 4,
            }}
          >
            {loading ? "Iniciando..." : "Iniciar sesión"}
          </button>
        </div>
      </div>
    </form>
  );
}
