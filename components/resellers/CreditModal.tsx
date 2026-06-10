"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Field, { fieldInput, fieldSelect } from "@/components/ui/Field";
import Button from "@/components/ui/Button";

interface CreditModalProps {
  reseller: { id: string; name: string; credits: number };
  onClose: () => void;
  onSaved: () => void;
}

export default function CreditModal({ reseller, onClose, onSaved }: CreditModalProps) {
  const [type, setType] = useState("LOAD");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/resellers/${reseller.id}/credits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, amount: parseFloat(amount), note }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error al procesar");
      return;
    }

    onSaved();
    onClose();
  }

  const isDebit = type === "DEDUCTION" || type === "PURCHASE";

  return (
    <Modal title={`Gestionar créditos - ${reseller.name}`} onClose={onClose} width={420}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "0.75rem 1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Saldo actual</span>
          <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>{reseller.credits.toFixed(2)}</span>
        </div>

        <Field label="Tipo de movimiento">
          <select
            style={fieldSelect}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="LOAD">Carga</option>
            <option value="DEDUCTION">Descuento</option>
            <option value="PURCHASE">Compra</option>
            <option value="REFUND">Reembolso</option>
          </select>
        </Field>

        <Field label="Monto">
          <input
            style={fieldInput}
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </Field>

        <Field label="Nota (opcional)">
          <input style={fieldInput} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>

        {amount && (
          <p style={{ fontSize: "0.78rem", color: isDebit ? "var(--primary-hover)" : "#22c55e" }}>
            Saldo resultante:{" "}
            <strong>
              {(reseller.credits + (isDebit ? -1 : 1) * parseFloat(amount || "0")).toFixed(2)}
            </strong>
          </p>
        )}

        {error && <p style={{ color: "var(--primary-hover)", fontSize: "0.8rem" }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant={isDebit ? "danger" : "primary"} disabled={loading}>
            {loading ? "Procesando..." : isDebit ? "Descontar" : "Cargar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
