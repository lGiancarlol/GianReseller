import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const request = await prisma.licenseRequest.findUnique({
    where: { id },
    include: {
      reseller: { select: { id: true, name: true, username: true } },
      provider: { select: { id: true, name: true, type: true } },
      product: { select: { id: true, name: true, externalId: true } },
      logs: { orderBy: { createdAt: "asc" } },
      movements: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!request) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(request);
}
