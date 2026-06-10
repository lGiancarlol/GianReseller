import type { IProvider, TestResult, LicenseResult, LicenseQuery } from "./BaseProvider";
import { notImplemented, notImplementedQuery } from "./BaseProvider";
import { decryptConfig } from "@/lib/crypto";
import type { ProviderConfig } from "@/types/provider";

export class KeyAuthProvider implements IProvider {
  private apiUrl: string;
  private apiKey: string;

  constructor(config: ProviderConfig) {
    const decrypted = decryptConfig(config);
    this.apiUrl = decrypted.apiUrl ?? "";
    this.apiKey = decrypted.apiKey ?? "";
  }

  async testConnection(): Promise<TestResult> {
    const start = Date.now();

    if (!this.apiUrl || !this.apiKey) {
      return { success: false, detail: "apiUrl y apiKey son requeridos para KeyAuth" };
    }

    // Verificar que la URL sea alcanzable con una peticion simple
    try {
      const url = new URL(this.apiUrl);
      const res = await fetch(url.origin, { method: "HEAD", signal: AbortSignal.timeout(8000) });

      return {
        success: true,
        detail: `Servidor KeyAuth alcanzable en ${url.origin} (HTTP ${res.status})`,
        latencyMs: Date.now() - start,
        raw: { status: res.status, url: url.origin },
      };
    } catch (err) {
      return {
        success: false,
        detail: `No se pudo conectar con el servidor KeyAuth: ${(err as Error).message}`,
        latencyMs: Date.now() - start,
      };
    }
  }

  async requestLicense(_product: string, _duration: string): Promise<LicenseResult> {
    return notImplemented("requestLicense via KeyAuth");
  }

  async queryLicense(_key: string): Promise<LicenseQuery> {
    return notImplementedQuery("queryLicense via KeyAuth");
  }

  async activateLicense(_key: string, _hwid?: string): Promise<LicenseResult> {
    return notImplemented("activateLicense via KeyAuth");
  }

  async deactivateLicense(_key: string): Promise<LicenseResult> {
    return notImplemented("deactivateLicense via KeyAuth");
  }

  async resetIp(_key: string): Promise<LicenseResult> {
    return notImplemented("resetIp via KeyAuth");
  }
}
