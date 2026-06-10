"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Field, { fieldSelect } from "@/components/ui/Field";
import Button from "@/components/ui/Button";

interface Reseller {
  id: string;
  name: string;
  username: string;
  credits: number;
}

interface Product {
  id: string;
  name: string;
  providerId: string;
  provider: { id: string; name: string; type: string };
}

interface LicenseRequestFormProps {
  onClose: () => void;
  onCreated: (id: string) => void;
}

export default function LicenseRequestForm({ onClose, onCreated }: LicenseRequestFormProps) {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [resellerId, setResellerId] = useState("");
  const [productId, setProductId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/resellers?status=ACTIVE").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([r, p]) => {
      setResellers(r);
      setProducts(p);
    });
  }, []);

  const selectedReseller = resellers.find((r) => r.id === resellerId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/license-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resellerId, productId }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error al procesar la solicitud");
      return;
    }

    onCreated(data.id);
    onClose();
  }

  return (
    <Modal title="Nueva solicitud de licencia" onClose={onClose} width={480}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Reseller">
          <select
            style={fieldSelect}
            value={resellerId}
            onChange={(e) => setResellerId(e.target.value)}
            required
          >
            <option value="">Seleccionar reseller...</option>
            {resellers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} (@{r.username}) — {r.credits.toFixed(2)} créditos
              </option>
            ))}
          </select>
        </Field>

        {selectedReseller && selectedReseller.credits < 1 && (
          <p style={{ color: "var(--primary-hover)", fontSize: "0.78rem" }}>
            Saldo insuficiente. Se requiere al menos 1 crédito.
          </p>
        )}

        <Field label="Producto">
          <select
            style={fieldSelect}
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          >
            <option value="">Seleccionar producto...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.provider.name} ({p.provider.type})
              </option>
            ))}
          </select>
        </Field>

        <div
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "0.65rem 0.85rem",
            fontSize: "0.78rem",
            color: "var(--text-muted)",
          }}
        >
          Costo: <strong style={{ color: "var(--text)" }}>1 crédito</strong> por licencia
        </div>

        {error && <p style={{ color: "var(--primary-hover)", fontSize: "0.8rem" }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            type="submit"
            disabled={loading || !resellerId || !productId || (selectedReseller?.credits ?? 0) < 1}
          >
            {loading ? "Procesando..." : "Generar solicitud"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
