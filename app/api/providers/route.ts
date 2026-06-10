import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { encryptConfig, maskConfig } from "@/lib/crypto";
import type { ProviderConfig } from "@/types/provider";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const type = searchParams.get("type") ?? "";

  const providers = await prisma.provider.findMany({
    where: {
      ...(search && { name: { contains: search, mode: "insensitive" } }),
      ...(type && { type: type as never }),
    },
    orderBy: { createdAt: "desc" },
  });

  // Enmascarar campos sensibles antes de enviar al cliente
  const masked = providers.map((p) => ({
    ...p,
    config: p.config ? maskConfig(p.config as ProviderConfig) : null,
  }));

  return NextResponse.json(masked);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { name, type, description, status, config } = body;

  if (!name || !type) {
    return NextResponse.json({ error: "Nombre y tipo son requeridos" }, { status: 400 });
  }

  const provider = await prisma.provider.create({
    data: {
      name,
      type,
      description,
      status: status ?? "ACTIVE",
      config: config ? encryptConfig(config as ProviderConfig) : {},
    },
  });

  await prisma.log.create({
    data: {
      action: "PROVIDER_CREATED",
      message: `Provider "${provider.name}" creado (${provider.type})`,
      metadata: { providerId: provider.id, type: provider.type },
    },
  });

  return NextResponse.json(provider, { status: 201 });
}
