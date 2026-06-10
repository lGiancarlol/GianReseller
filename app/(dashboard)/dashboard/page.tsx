import { prisma } from "@/lib/prisma";
import StatCard from "@/components/ui/StatCard";

export default async function DashboardPage() {
  const [providers, resellers, requests, logs] = await Promise.all([
    prisma.provider.count(),
    prisma.reseller.count(),
    prisma.licenseRequest.count(),
    prisma.log.count(),
  ]);

  const successRequests = await prisma.licenseRequest.count({
    where: { status: "SUCCESS" },
  });

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Dashboard</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: 4 }}>
          Resumen general del sistema
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "1rem",
        }}
      >
        <StatCard label="Providers" value={providers} />
        <StatCard label="Resellers" value={resellers} />
        <StatCard label="License Requests" value={requests} />
        <StatCard label="Licencias Exitosas" value={successRequests} />
        <StatCard label="Logs" value={logs} />
      </div>
    </div>
  );
}
