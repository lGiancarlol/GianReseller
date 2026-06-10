"use client";

import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface Log {
  id: string;
  action: string;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface Movement {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
}

interface RequestDetail {
  id: string;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  licenseKey: string | null;
  externalRequestId: string | null;
  creditsUsed: number;
  errorMessage: string | null;
  responseData: unknown;
  createdAt: string;
  updatedAt: string;
  reseller: { id: string; name: string; username: string };
  provider: { id: string; name: string; type: string };
  product: { id: string; name: string; externalId: string | null };
  logs: Log[];
  movements: Movement[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PROCESSING: "Procesando",
  SUCCESS: "Exitosa",
  FAILED: "Fallida",
};

const STATUS_BADGE: Record<string, "active" | "inactive" | "type"> = {
  SUCCESS: "active",
  FAILED: "inactive",
  PENDING: "type",
  PROCESSING: "type",
};

const MOVEMENT_COLORS: Record<string, string> = {
  LOAD: "#22c55e",
  REFUND: "#22c55e",
  DEDUCTION: "var(--primary-hover)",
  PURCHASE: "var(--primary-hover)",
};

const MOVEMENT_LABELS: Record<string, string> = {
  LOAD: "Carga",
  DEDUCTION: "Descuento",
  PURCHASE: "Compra",
  REFUND: "Reembolso",
};

function SectionBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        overflow: "hidden",
        marginBottom: "1.25rem",
      }}
    >
      <div style={{ padding: "0.85rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: "0.875rem", fontWeight: 600 }}>{title}</h2>
      </div>
      <div style={{ padding: "1.25rem" }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
      <span style={{ width: 160, flexShrink: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: "0.85rem" }}>{children}</span>
    </div>
  );
}

export default function LicenseRequestDetailClient({ request }: { request: RequestDetail }) {
  const router = useRouter();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: "monospace" }}>
              {request.id}
            </h1>
            <Badge variant={STATUS_BADGE[request.status]}>
              {STATUS_LABELS[request.status]}
            </Badge>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 4 }}>
            {new Date(request.createdAt).toLocaleString("es")}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>Volver</Button>
      </div>

      <SectionBox title="Informacion de la solicitud">
        <InfoRow label="Reseller">{request.reseller.name} <span style={{ color: "var(--text-muted)" }}>(@{request.reseller.username})</span></InfoRow>
        <InfoRow label="Provider">{request.provider.name} <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>({request.provider.type})</span></InfoRow>
        <InfoRow label="Producto">{request.product.name}</InfoRow>
        <InfoRow label="Créditos usados"><strong>{request.creditsUsed.toFixed(2)}</strong></InfoRow>
        {request.externalRequestId && <InfoRow label="ID externo"><code style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{request.externalRequestId}</code></InfoRow>}
        {request.licenseKey && (
          <InfoRow label="License Key">
            <code
              style={{
                background: "rgba(193,18,31,0.08)",
                border: "1px solid rgba(193,18,31,0.2)",
                borderRadius: 4,
                padding: "3px 10px",
                color: "var(--primary-hover)",
                fontFamily: "monospace",
                fontSize: "0.9rem",
                letterSpacing: "0.05em",
              }}
            >
              {request.licenseKey}
            </code>
          </InfoRow>
        )}
        {request.errorMessage && (
          <InfoRow label="Error">
            <span style={{ color: "var(--primary-hover)" }}>{request.errorMessage}</span>
          </InfoRow>
        )}
      </SectionBox>

      {request.responseData && (
        <SectionBox title="Respuesta del provider">
          <pre
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "0.85rem 1rem",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              overflow: "auto",
              maxHeight: 240,
              margin: 0,
            }}
          >
            {JSON.stringify(request.responseData, null, 2)}
          </pre>
        </SectionBox>
      )}

      {request.movements.length > 0 && (
        <SectionBox title="Movimientos de créditos">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Tipo", "Monto", "Saldo resultante", "Nota", "Fecha"].map((h) => (
                  <th key={h} style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {request.movements.map((m) => {
                const isDebit = m.type === "DEDUCTION" || m.type === "PURCHASE";
                return (
                  <tr key={m.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.65rem 0.75rem", color: MOVEMENT_COLORS[m.type], fontWeight: 500, fontSize: "0.8rem" }}>
                      {MOVEMENT_LABELS[m.type] ?? m.type}
                    </td>
                    <td style={{ padding: "0.65rem 0.75rem", color: MOVEMENT_COLORS[m.type], fontWeight: 700 }}>
                      {isDebit ? "-" : "+"}{m.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: "0.65rem 0.75rem", fontSize: "0.82rem" }}>{m.balanceAfter.toFixed(2)}</td>
                    <td style={{ padding: "0.65rem 0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>{m.note ?? "—"}</td>
                    <td style={{ padding: "0.65rem 0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(m.createdAt).toLocaleString("es")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </SectionBox>
      )}

      {request.logs.length > 0 && (
        <SectionBox title="Logs de la solicitud">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {request.logs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "0.6rem 0.85rem",
                  background: "var(--bg)",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--primary-hover)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap",
                    marginTop: 2,
                    minWidth: 220,
                  }}
                >
                  {log.action}
                </span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", flex: 1 }}>{log.message}</span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {new Date(log.createdAt).toLocaleString("es")}
                </span>
              </div>
            ))}
          </div>
        </SectionBox>
      )}
    </div>
  );
}
