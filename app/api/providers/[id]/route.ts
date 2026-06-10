import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const provider = await prisma.provider.findUnique({ where: { id } });
  if (!provider) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(provider);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, type, description, status, config } = body;

  const existing = await prisma.provider.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const updated = await prisma.provider.update({
    where: { id },
    data: { name, type, description, status, config },
  });

  // Determinar si el cambio fue de estado para registrar log específico
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

  return NextResponse.json(updated);
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
