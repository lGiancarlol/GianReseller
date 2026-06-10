"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Field, { fieldInput, fieldSelect } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import type { Provider, ProviderFormData, ProviderType } from "@/types/provider";

const MASK = "********";

const PROVIDER_TYPES: { value: ProviderType; label: string }[] = [
  { value: "TELEGRAM_BOT", label: "Telegram Bot" },
  { value: "KEYAUTH", label: "KeyAuth" },
  { value: "REST_API", label: "REST API" },
  { value: "CUSTOM", label: "Custom" },
];

interface Props {
  provider?: Provider;
  onClose: () => void;
  onSaved: () => void;
}

function emptyForm(): ProviderFormData {
  return { name: "", type: "TELEGRAM_BOT", description: "", status: "ACTIVE", config: {} };
}

// Componente de input para campos sensibles
// Si el valor almacenado es la mascara, muestra placeholder especial
// y solo envia el nuevo valor si el usuario escribe algo
function SecretInput({
  storedValue,
  onChange,
  placeholder,
}: {
  storedValue: string;
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const isMasked = storedValue === MASK;
  const [touched, setTouched] = useState(false);

  // Si el campo esta enmascarado y el usuario no ha tocado el campo,
  // mostramos un input vacio con placeholder descriptivo
  if (isMasked && !touched) {
    return (
      <div style={{ position: "relative" }}>
        <input
          style={{ ...fieldInput, color: "var(--text-muted)" }}
          value=""
          placeholder={`${MASK} (dejar vacio para conservar)`}
          onFocus={() => setTouched(true)}
          onChange={() => {}}
          readOnly={false}
        />
      </div>
    );
  }

  return (
    <input
      style={fieldInput}
      value={isMasked && touched ? "" : storedValue}
      placeholder={placeholder}
      onChange={(e) => {
        const val = e.target.value;
        // Si el usuario borra todo, volver a la mascara para conservar el valor
        onChange(val === "" && isMasked ? MASK : val);
      }}
      onBlur={() => {
        if (storedValue === "") setTouched(false);
      }}
    />
  );
}

export default function ProviderForm({ provider, onClose, onSaved }: Props) {
  const isEdit = !!provider;

  const [form, setForm] = useState<ProviderFormData>(
    provider
      ? {
          name: provider.name,
          type: provider.type,
          description: provider.description ?? "",
          status: provider.status,
          config: provider.config ?? {},
        }
      : emptyForm()
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function setConfig(key: string, value: string) {
    setForm((f) => ({ ...f, config: { ...f.config, [key]: value } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = isEdit ? `/api/providers/${provider!.id}` : "/api/providers";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar");
      return;
    }

    onSaved();
    onClose();
  }

  const cfg = form.config;

  return (
    <Modal title={isEdit ? "Editar Provider" : "Nuevo Provider"} onClose={onClose} width={560}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Field label="Nombre *">
          <input
            required
            style={fieldInput}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nombre del proveedor"
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <Field label="Tipo *">
            <select
              style={fieldSelect}
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as ProviderType, config: {} }))
              }
            >
              {PROVIDER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Estado">
            <select
              style={fieldSelect}
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as "ACTIVE" | "INACTIVE" }))
              }
            >
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
          </Field>
        </div>

        <Field label="Descripcion">
          <input
            style={fieldInput}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Descripcion opcional"
          />
        </Field>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: 4 }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
            Configuracion — {PROVIDER_TYPES.find((t) => t.value === form.type)?.label}
          </p>

          {form.type === "TELEGRAM_BOT" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Field label="Bot Token" hint="Sensible: se almacena cifrado">
                <SecretInput
                  storedValue={cfg.botToken ?? ""}
                  onChange={(v) => setConfig("botToken", v)}
                  placeholder="123456:ABCdef..."
                />
              </Field>
              <Field label="Chat ID">
                <input
                  style={fieldInput}
                  value={cfg.chatId ?? ""}
                  onChange={(e) => setConfig("chatId", e.target.value)}
                  placeholder="-100123456789"
                />
              </Field>
              <Field label="Session String" hint="Sensible: se almacena cifrado">
                <SecretInput
                  storedValue={cfg.sessionString ?? ""}
                  onChange={(v) => setConfig("sessionString", v)}
                  placeholder="Session string (opcional)"
                />
              </Field>
            </div>
          )}

          {form.type === "KEYAUTH" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Field label="API URL">
                <input
                  style={fieldInput}
                  value={cfg.apiUrl ?? ""}
                  onChange={(e) => setConfig("apiUrl", e.target.value)}
                  placeholder="https://keyauth.win/api/1.2/"
                />
              </Field>
              <Field label="API Key" hint="Sensible: se almacena cifrado">
                <SecretInput
                  storedValue={cfg.apiKey ?? ""}
                  onChange={(v) => setConfig("apiKey", v)}
                  placeholder="API Key de KeyAuth"
                />
              </Field>
            </div>
          )}

          {form.type === "REST_API" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Field label="API URL">
                <input
                  style={fieldInput}
                  value={cfg.apiUrl ?? ""}
                  onChange={(e) => setConfig("apiUrl", e.target.value)}
                  placeholder="https://api.proveedor.com/v1"
                />
              </Field>
              <Field label="API Key / Bearer Token" hint="Sensible: se almacena cifrado">
                <SecretInput
                  storedValue={cfg.apiKey ?? ""}
                  onChange={(v) => setConfig("apiKey", v)}
                  placeholder="Bearer token o API key"
                />
              </Field>
              <Field label="Headers personalizados (JSON)" hint='Ejemplo: {"X-Custom": "valor"}'>
                <textarea
                  style={{ ...fieldInput, resize: "vertical", minHeight: 72 }}
                  value={cfg.customJson ?? ""}
                  onChange={(e) => setConfig("customJson", e.target.value)}
                  placeholder='{"Authorization": "Bearer ...", "X-App-Id": "..."}'
                />
              </Field>
            </div>
          )}

          {form.type === "CUSTOM" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Field label="API URL">
                <input
                  style={fieldInput}
                  value={cfg.apiUrl ?? ""}
                  onChange={(e) => setConfig("apiUrl", e.target.value)}
                  placeholder="URL del proveedor personalizado"
                />
              </Field>
              <Field label="API Key" hint="Sensible: se almacena cifrado">
                <SecretInput
                  storedValue={cfg.apiKey ?? ""}
                  onChange={(v) => setConfig("apiKey", v)}
                  placeholder="Token o clave de autenticacion"
                />
              </Field>
              <Field label="Configuracion JSON personalizada" hint="Parametros adicionales en formato JSON">
                <textarea
                  style={{ ...fieldInput, resize: "vertical", minHeight: 90 }}
                  value={cfg.customJson ?? ""}
                  onChange={(e) => setConfig("customJson", e.target.value)}
                  placeholder='{"param1": "valor", "param2": "valor"}'
                />
              </Field>
            </div>
          )}
        </div>

        {error && (
          <p style={{ color: "var(--primary-hover)", fontSize: "0.8rem" }}>{error}</p>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: 4 }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear provider"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
