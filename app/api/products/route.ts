import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const products = await prisma.providerProduct.findMany({
    where: {
      active: true,
      provider: { status: "ACTIVE" },
    },
    include: {
      provider: { select: { id: true, name: true, type: true } },
    },
    orderBy: [{ provider: { name: "asc" } }, { name: "asc" }],
  });

  return NextResponse.json(products);
}
