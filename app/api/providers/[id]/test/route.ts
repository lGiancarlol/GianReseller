import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ProviderFactory } from "@/lib/providers/ProviderFactory";
import type { ProviderConfig, ProviderType } from "@/types/provider";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const provider = await prisma.provider.findUnique({ where: { id } });
  if (!provider) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const config = (provider.config ?? {}) as ProviderConfig;
  const testedAt = new Date();

  let result;
  try {
    const driver = ProviderFactory.create(provider.type as ProviderType, config);
    result = await driver.testConnection();
  } catch (err) {
    result = { success: false, detail: `Error interno: ${(err as Error).message}` };
  }

  // Actualizar campos lastTestedAt y lastTestOk en el provider
  await prisma.provider.update({
    where: { id },
    data: { lastTestedAt: testedAt, lastTestOk: result.success },
  });

  // Guardar log tecnico completo con request, response, latencia y timestamp
  await prisma.log.create({
    data: {
      action: result.success ? "PROVIDER_TEST" : "PROVIDER_TEST_FAIL",
      message: `[${provider.type}] ${provider.name}: ${result.detail}`,
      metadata: {
        providerId: id,
        type: provider.type,
        success: result.success,
        detail: result.detail,
        latencyMs: result.latencyMs ?? null,
        raw: result.raw ?? null,
        testedAt: testedAt.toISOString(),
      },
    },
  });

  return NextResponse.json({
    success: result.success,
    detail: result.detail,
    latencyMs: result.latencyMs,
    testedAt: testedAt.toISOString(),
  });
}
