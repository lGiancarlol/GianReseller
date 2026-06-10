import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const products = await prisma.providerProduct.findMany({
    where: { providerId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, externalId } = body;

  if (!name) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });

  const provider = await prisma.provider.findUnique({ where: { id } });
  if (!provider) return NextResponse.json({ error: "Provider no encontrado" }, { status: 404 });

  const product = await prisma.providerProduct.create({
    data: { providerId: id, name, externalId: externalId ?? null },
  });

  return NextResponse.json(product, { status: 201 });
}
