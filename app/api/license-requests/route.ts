import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ProviderFactory } from "@/lib/providers/ProviderFactory";
import type { ProviderConfig } from "@/types/provider";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const providerId = searchParams.get("providerId") ?? "";
  const resellerId = searchParams.get("resellerId") ?? "";

  const requests = await prisma.licenseRequest.findMany({
    where: {
      ...(status && { status: status as never }),
      ...(providerId && { providerId }),
      ...(resellerId && { resellerId }),
    },
    include: {
      reseller: { select: { id: true, name: true, username: true } },
      provider: { select: { id: true, name: true, type: true } },
      product: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { resellerId, productId } = body;

  if (!resellerId || !productId) {
    return NextResponse.json({ error: "resellerId y productId son requeridos" }, { status: 400 });
  }

  // Validar reseller y saldo
  const reseller = await prisma.reseller.findUnique({ where: { id: resellerId } });
  if (!reseller) return NextResponse.json({ error: "Reseller no encontrado" }, { status: 404 });
  if (reseller.status !== "ACTIVE") return NextResponse.json({ error: "Reseller inactivo" }, { status: 400 });

  // Validar producto y obtener provider
  const product = await prisma.providerProduct.findUnique({
    where: { id: productId },
    include: { provider: true },
  });
  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  if (!product.active) return NextResponse.json({ error: "Producto inactivo" }, { status: 400 });
  if (product.provider.status !== "ACTIVE") return NextResponse.json({ error: "Provider inactivo" }, { status: 400 });

  // Por ahora el costo de cada licencia es 1 crédito
  const creditsRequired = 1;
  if (reseller.credits < creditsRequired) {
    return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 });
  }

  // Crear la request en PENDING y descontar créditos en una transacción
  const newBalance = reseller.credits - creditsRequired;

  const [licenseRequest, , movement] = await prisma.$transaction([
    prisma.licenseRequest.create({
      data: {
        resellerId,
        providerId: product.providerId,
        productId,
        status: "PROCESSING",
        creditsUsed: creditsRequired,
      },
    }),
    prisma.reseller.update({
      where: { id: resellerId },
      data: { credits: newBalance },
    }),
    prisma.creditMovement.create({
      data: {
        resellerId,
        type: "PURCHASE",
        amount: creditsRequired,
        balanceAfter: newBalance,
        note: `Solicitud de licencia - ${product.name}`,
      },
    }),
  ]);

  // Vincular el movimiento a la request
  await prisma.creditMovement.update({
    where: { id: movement.id },
    data: { requestId: licenseRequest.id },
  });

  await prisma.log.create({
    data: {
      action: "LICENSE_REQUEST_CREATED",
      message: `Solicitud creada por "${reseller.name}" para producto "${product.name}"`,
      metadata: { requestId: licenseRequest.id, resellerId, productId, creditsUsed: creditsRequired },
      requestId: licenseRequest.id,
    },
  });

  // Llamar al driver del provider
  let driverResult;
  try {
    const driver = ProviderFactory.create(
      product.provider.type,
      (product.provider.config ?? {}) as ProviderConfig
    );
    driverResult = await driver.createLicense(product.id, product.externalId ?? undefined);
  } catch (err) {
    driverResult = { success: false, error: (err as Error).message };
  }

  if (driverResult.success) {
    const updated = await prisma.licenseRequest.update({
      where: { id: licenseRequest.id },
      data: {
        status: "SUCCESS",
        licenseKey: driverResult.licenseKey ?? null,
        externalRequestId: driverResult.externalId ?? null,
        responseData: driverResult.raw as object ?? null,
      },
      include: {
        reseller: { select: { id: true, name: true, username: true } },
        provider: { select: { id: true, name: true, type: true } },
        product: { select: { id: true, name: true } },
      },
    });

    await prisma.log.create({
      data: {
        action: "LICENSE_REQUEST_SUCCESS",
        message: `Licencia generada para "${reseller.name}": ${driverResult.licenseKey}`,
        metadata: { requestId: licenseRequest.id, licenseKey: driverResult.licenseKey },
        requestId: licenseRequest.id,
      },
    });

    return NextResponse.json(updated, { status: 201 });
  }

  // Falló: marcar como FAILED y emitir reembolso
  await prisma.licenseRequest.update({
    where: { id: licenseRequest.id },
    data: {
      status: "FAILED",
      errorMessage: driverResult.error ?? "Error desconocido del provider",
      responseData: driverResult.raw as object ?? null,
    },
  });

  const refundBalance = newBalance + creditsRequired;
  await prisma.$transaction([
    prisma.reseller.update({ where: { id: resellerId }, data: { credits: refundBalance } }),
    prisma.creditMovement.create({
      data: {
        resellerId,
        type: "REFUND",
        amount: creditsRequired,
        balanceAfter: refundBalance,
        note: `Reembolso por fallo en solicitud ${licenseRequest.id}`,
        requestId: licenseRequest.id,
      },
    }),
  ]);

  await prisma.log.createMany({
    data: [
      {
        action: "LICENSE_REQUEST_FAILED",
        message: `Fallo en solicitud de "${reseller.name}": ${driverResult.error}`,
        metadata: { requestId: licenseRequest.id, error: driverResult.error },
        requestId: licenseRequest.id,
      },
      {
        action: "LICENSE_REFUND_CREATED",
        message: `Reembolso de ${creditsRequired} crédito(s) a "${reseller.name}"`,
        metadata: { requestId: licenseRequest.id, amount: creditsRequired, balanceAfter: refundBalance },
        requestId: licenseRequest.id,
      },
    ],
  });

  return NextResponse.json(
    { error: driverResult.error ?? "Error al procesar la solicitud", requestId: licenseRequest.id },
    { status: 502 }
  );
}
