import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { type, amount, note } = body;

  if (!type || !amount || amount <= 0) {
    return NextResponse.json({ error: "Tipo y monto válido son requeridos" }, { status: 400 });
  }

  if (!["LOAD", "DEDUCTION", "PURCHASE", "REFUND"].includes(type)) {
    return NextResponse.json({ error: "Tipo de movimiento inválido" }, { status: 400 });
  }

  const reseller = await prisma.reseller.findUnique({ where: { id } });
  if (!reseller) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const isDebit = type === "DEDUCTION" || type === "PURCHASE";
  const delta = isDebit ? -amount : amount;
  const newBalance = reseller.credits + delta;

  if (newBalance < 0) {
    return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 });
  }

  const [updated, movement] = await prisma.$transaction([
    prisma.reseller.update({
      where: { id },
      data: { credits: newBalance },
    }),
    prisma.creditMovement.create({
      data: {
        resellerId: id,
        type,
        amount,
        balanceAfter: newBalance,
        note: note ?? null,
      },
    }),
  ]);

  const logAction = isDebit ? "RESELLER_CREDIT_DEDUCTED" : "RESELLER_CREDIT_ADDED";
  await prisma.log.create({
    data: {
      action: logAction,
      message: `${isDebit ? "Descuento" : "Carga"} de ${amount} créditos a "${reseller.name}". Saldo: ${newBalance}`,
      metadata: { resellerId: id, type, amount, balanceAfter: newBalance },
    },
  });

  return NextResponse.json({ credits: updated.credits, movement });
}
