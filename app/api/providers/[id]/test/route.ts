import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const provider = await prisma.provider.findUnique({ where: { id } });
  if (!provider) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Simulación: verificar que los campos requeridos por tipo estén presentes
  const config = (provider.config ?? {}) as Record<string, unknown>;
  let success = true;
  let detail = "Conexión simulada exitosa";

  if (provider.type === "TELEGRAM_BOT") {
    if (!config.botToken || !config.chatId) {
      success = false;
      detail = "Faltan campos: botToken y chatId son requeridos para Telegram Bot";
    }
  } else if (provider.type === "KEYAUTH") {
    if (!config.apiUrl || !config.apiKey) {
      success = false;
      detail = "Faltan campos: apiUrl y apiKey son requeridos para KeyAuth";
    }
  } else if (provider.type === "REST_API") {
    if (!config.apiUrl) {
      success = false;
      detail = "Falta campo: apiUrl es requerido para REST API";
    }
  }

  await prisma.log.create({
    data: {
      action: success ? "PROVIDER_TEST" : "PROVIDER_ERROR",
      message: `Prueba de conexión para "${provider.name}": ${detail}`,
      metadata: { providerId: id, success, type: provider.type },
    },
  });

  return NextResponse.json({ success, detail });
}
