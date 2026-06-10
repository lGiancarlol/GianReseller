import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const reseller = await prisma.reseller.findUnique({
    where: { id },
    include: {
      movements: { orderBy: { createdAt: "desc" }, take: 50 },
      _count: { select: { requests: true } },
    },
  });

  if (!reseller) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { password: _, ...result } = reseller;
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, username, email, discordId, telegramId, status, password } = body;

  const data: Record<string, unknown> = { name, username, email, discordId, telegramId, status };
  if (password) data.password = await bcrypt.hash(password, 10);

  const reseller = await prisma.reseller.update({ where: { id }, data });

  await prisma.log.create({
    data: {
      action: "RESELLER_UPDATED",
      message: `Reseller "${reseller.name}" actualizado`,
      metadata: { resellerId: reseller.id },
    },
  });

  const { password: _, ...result } = reseller;
  return NextResponse.json(result);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const reseller = await prisma.reseller.findUnique({ where: { id } });
  if (!reseller) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.reseller.delete({ where: { id } });

  await prisma.log.create({
    data: {
      action: "RESELLER_DELETED",
      message: `Reseller "${reseller.name}" (${reseller.username}) eliminado`,
      metadata: { resellerId: id },
    },
  });

  return NextResponse.json({ ok: true });
}
