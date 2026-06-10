import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { encryptConfig, maskConfig, isEncrypted } from "@/lib/crypto";
import type { ProviderConfig } from "@/types/provider";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const provider = await prisma.provider.findUnique({ where: { id } });
  if (!provider) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Obtener productos y logs recientes en paralelo
  const [products, logs] = await Promise.all([
    prisma.providerProduct.findMany({ where: { providerId: id }, orderBy: { createdAt: "asc" } }),
    prisma.log.findMany({
      where: { metadata: { path: ["providerId"], equals: id } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({
    ...provider,
    config: provider.config ? maskConfig(provider.config as ProviderConfig) : null,
    products,
    logs,
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, type, description, status, config } = body;

  const existing = await prisma.provider.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Combinar config existente con la nueva:
  // Si el campo entrante es "********" (mascara), conservar el valor cifrado original
  const existingConfig = (existing.config ?? {}) as ProviderConfig;
  const incomingConfig = (config ?? {}) as ProviderConfig;
  const mergedConfig: ProviderConfig = { ...existingConfig };

  for (const key of Object.keys(incomingConfig) as (keyof ProviderConfig)[]) {
    const val = incomingConfig[key];
    if (typeof val === "string") {
      if (val === "********") {
        // El usuario no modifico este campo, conservar el valor cifrado existente
        continue;
      }
      if (isEncrypted(val)) {
        // Ya viene cifrado (no deberia ocurrir normalmente, pero se acepta)
        (mergedConfig as Record<string, unknown>)[key] = val;
      } else {
        (mergedConfig as Record<string, unknown>)[key] = val;
      }
    } else {
      (mergedConfig as Record<string, unknown>)[key] = val;
    }
  }

  const finalConfig = encryptConfig(mergedConfig);

  const updated = await prisma.provider.update({
    where: { id },
    data: { name, type, description, status, config: finalConfig as object },
  });

  const statusChanged = existing.status !== status;
  const action = statusChanged
    ? status === "ACTIVE"
      ? "PROVIDER_ACTIVATED"
      : "PROVIDER_DEACTIVATED"
    : "PROVIDER_UPDATED";

  await prisma.log.create({
    data: {
      action,
      message: statusChanged
        ? `Provider "${updated.name}" ${status === "ACTIVE" ? "activado" : "desactivado"}`
        : `Provider "${updated.name}" actualizado`,
      metadata: { providerId: updated.id },
    },
  });

  // Retornar enmascarado
  return NextResponse.json({
    ...updated,
    config: maskConfig(finalConfig),
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.provider.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.provider.delete({ where: { id } });

  await prisma.log.create({
    data: {
      action: "PROVIDER_DELETED",
      message: `Provider "${existing.name}" eliminado`,
      metadata: { providerId: id, type: existing.type },
    },
  });

  return NextResponse.json({ success: true });
}
