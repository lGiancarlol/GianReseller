import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string; productId: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { productId } = await params;
  const body = await req.json();
  const { name, externalId, active } = body;

  const updated = await prisma.providerProduct.update({
    where: { id: productId },
    data: { name, externalId, active },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { productId } = await params;

  await prisma.providerProduct.delete({ where: { id: productId } });

  return NextResponse.json({ success: true });
}
