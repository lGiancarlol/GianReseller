import type { IProvider, TestResult, LicenseResult, LicenseQuery, CreateLicenseResult } from "./BaseProvider";
import { notImplemented, notImplementedQuery } from "./BaseProvider";
import { decryptConfig } from "@/lib/crypto";
import type { ProviderConfig } from "@/types/provider";

const TELEGRAM_API = "https://api.telegram.org/bot";

export class TelegramProvider implements IProvider {
  private botToken: string;
  private chatId: string;

  constructor(config: ProviderConfig) {
    const decrypted = decryptConfig(config);
    this.botToken = decrypted.botToken ?? "";
    this.chatId = decrypted.chatId ?? "";
  }

  async testConnection(): Promise<TestResult> {
    const start = Date.now();

    if (!this.botToken) {
      return { success: false, detail: "botToken no configurado" };
    }

    // Paso 1: validar el bot token con getMe
    let getMeData: Record<string, unknown>;
    try {
      const res = await fetch(`${TELEGRAM_API}${this.botToken}/getMe`);
      getMeData = await res.json() as Record<string, unknown>;
    } catch (err) {
      return {
        success: false,
        detail: `Error de red al contactar Telegram: ${(err as Error).message}`,
      };
    }

    if (!(getMeData as { ok?: boolean }).ok) {
      return {
        success: false,
        detail: `Bot token invalido: ${JSON.stringify((getMeData as { description?: string }).description ?? getMeData)}`,
        raw: getMeData,
      };
    }

    const botInfo = (getMeData as { result: { username: string; first_name: string } }).result;

    // Paso 2: validar el chat ID si esta configurado
    if (this.chatId) {
      let getChatData: Record<string, unknown>;
      try {
        const res = await fetch(`${TELEGRAM_API}${this.botToken}/getChat?chat_id=${this.chatId}`);
        getChatData = await res.json() as Record<string, unknown>;
      } catch (err) {
        return {
          success: false,
          detail: `Bot valido (@${botInfo.username}) pero error al verificar chat ID: ${(err as Error).message}`,
          raw: botInfo,
        };
      }

      if (!(getChatData as { ok?: boolean }).ok) {
        return {
          success: false,
          detail: `Bot valido (@${botInfo.username}) pero chat ID invalido o bot no es miembro del chat`,
          latencyMs: Date.now() - start,
          raw: getChatData,
        };
      }

      const chatInfo = (getChatData as { result: { title?: string; type: string } }).result;
      return {
        success: true,
        detail: `Bot @${botInfo.username} conectado. Chat: "${chatInfo.title ?? this.chatId}" (${chatInfo.type})`,
        latencyMs: Date.now() - start,
        raw: { bot: botInfo, chat: chatInfo },
      };
    }

    return {
      success: true,
      detail: `Bot @${botInfo.username} (${botInfo.first_name}) conectado correctamente`,
      latencyMs: Date.now() - start,
      raw: botInfo,
    };
  }

  // Los metodos de licencia via Telegram dependen del flujo de mensajes
  // que se implementara en integracion real futura
  async createLicense(productId: string, externalId?: string): Promise<CreateLicenseResult> {
    // Simulacion: genera una key de prueba hasta integracion real con bot
    return {
      success: true,
      licenseKey: `TG-${productId.slice(0, 6).toUpperCase()}-${Date.now()}`,
      externalId: externalId ?? `tg_sim_${Date.now()}`,
      raw: { simulated: true, provider: "telegram" },
    };
  }

  async requestLicense(_product: string, _duration: string): Promise<LicenseResult> {
    return notImplemented("requestLicense via Telegram");
  }

  async queryLicense(_key: string): Promise<LicenseQuery> {
    return notImplementedQuery("queryLicense via Telegram");
  }

  async activateLicense(_key: string): Promise<LicenseResult> {
    return notImplemented("activateLicense via Telegram");
  }

  async deactivateLicense(_key: string): Promise<LicenseResult> {
    return notImplemented("deactivateLicense via Telegram");
  }

  async resetIp(_key: string): Promise<LicenseResult> {
    return notImplemented("resetIp via Telegram");
  }
}
