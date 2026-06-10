import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";

  const resellers = await prisma.reseller.findMany({
    where: {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { username: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(status && { status: status as "ACTIVE" | "INACTIVE" }),
    },
    include: {
      _count: { select: { requests: true, movements: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = resellers.map(({ password: _, ...r }) => r);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { name, username, email, discordId, telegramId, password, status } = body;

  if (!name || !username || !password) {
    return NextResponse.json({ error: "Nombre, usuario y contraseña son requeridos" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);

  const reseller = await prisma.reseller.create({
    data: { name, username, email, discordId, telegramId, password: hashed, status: status ?? "ACTIVE" },
  });

  await prisma.log.create({
    data: {
      action: "RESELLER_CREATED",
      message: `Reseller "${reseller.name}" (${reseller.username}) creado`,
      metadata: { resellerId: reseller.id },
    },
  });

  const { password: _, ...result } = reseller;
  return NextResponse.json(result, { status: 201 });
}
