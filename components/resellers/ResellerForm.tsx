"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Field, { fieldInput, fieldSelect } from "@/components/ui/Field";
import Button from "@/components/ui/Button";

interface ResellerFormData {
  name: string;
  username: string;
  email: string;
  discordId: string;
  telegramId: string;
  status: string;
  password: string;
}

interface ResellerFormProps {
  initial?: Partial<ResellerFormData> & { id?: string };
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY: ResellerFormData = {
  name: "",
  username: "",
  email: "",
  discordId: "",
  telegramId: "",
  status: "ACTIVE",
  password: "",
};

export default function ResellerForm({ initial, onClose, onSaved }: ResellerFormProps) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<ResellerFormData>({ ...EMPTY, ...initial });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof ResellerFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body: Partial<ResellerFormData> = { ...form };
    if (isEdit && !body.password) delete body.password;

    const res = await fetch(
      isEdit ? `/api/resellers/${initial!.id}` : "/api/resellers",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error al guardar");
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <Modal title={isEdit ? "Editar Reseller" : "Nuevo Reseller"} onClose={onClose}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Nombre completo">
            <input style={fieldInput} value={form.name} onChange={set("name")} required />
          </Field>
          <Field label="Usuario">
            <input style={fieldInput} value={form.username} onChange={set("username")} required />
          </Field>
        </div>

        <Field label="Email">
          <input style={fieldInput} type="email" value={form.email} onChange={set("email")} />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Discord ID">
            <input style={fieldInput} value={form.discordId} onChange={set("discordId")} placeholder="123456789" />
          </Field>
          <Field label="Telegram ID">
            <input style={fieldInput} value={form.telegramId} onChange={set("telegramId")} placeholder="@usuario" />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label={isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}>
            <input
              style={fieldInput}
              type="password"
              value={form.password}
              onChange={set("password")}
              required={!isEdit}
            />
          </Field>
          <Field label="Estado">
            <select style={fieldSelect} value={form.status} onChange={set("status")}>
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
          </Field>
        </div>

        {error && (
          <p style={{ color: "var(--primary-hover)", fontSize: "0.8rem" }}>{error}</p>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear reseller"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
