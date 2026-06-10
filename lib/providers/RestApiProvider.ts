import type { IProvider, TestResult, LicenseResult, LicenseQuery } from "./BaseProvider";
import { notImplemented, notImplementedQuery } from "./BaseProvider";
import { decryptConfig } from "@/lib/crypto";
import type { ProviderConfig } from "@/types/provider";

export class RestApiProvider implements IProvider {
  private apiUrl: string;
  private apiKey: string;
  private customHeaders: Record<string, string>;

  constructor(config: ProviderConfig) {
    const decrypted = decryptConfig(config);
    this.apiUrl = decrypted.apiUrl ?? "";
    this.apiKey = decrypted.apiKey ?? "";

    // Parsear headers personalizados desde customJson
    this.customHeaders = {};
    if (decrypted.customJson) {
      try {
        const parsed = JSON.parse(decrypted.customJson);
        if (typeof parsed === "object" && parsed !== null) {
          this.customHeaders = parsed as Record<string, string>;
        }
      } catch {
        // JSON invalido, se ignoran los headers personalizados
      }
    }
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.customHeaders,
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  async testConnection(): Promise<TestResult> {
    const start = Date.now();

    if (!this.apiUrl) {
      return { success: false, detail: "apiUrl no configurada" };
    }

    try {
      const res = await fetch(this.apiUrl, {
        method: "GET",
        headers: this.buildHeaders(),
        signal: AbortSignal.timeout(10000),
      });

      const latencyMs = Date.now() - start;

      // Intentar leer el body para incluirlo en el resultado
      let rawBody: unknown;
      try {
        rawBody = await res.json();
      } catch {
        rawBody = { status: res.status, statusText: res.statusText };
      }

      // Considerar exitoso si el servidor respondio (incluso con 401/403)
      // ya que eso confirma que el endpoint existe
      const success = res.status < 500;
      const detail = success
        ? `Servidor respondio HTTP ${res.status} en ${latencyMs}ms`
        : `El servidor respondio con error HTTP ${res.status}`;

      return { success, detail, latencyMs, raw: rawBody };
    } catch (err) {
      return {
        success: false,
        detail: `Error de conexion: ${(err as Error).message}`,
        latencyMs: Date.now() - start,
      };
    }
  }

  async requestLicense(_product: string, _duration: string): Promise<LicenseResult> {
    return notImplemented("requestLicense via REST API");
  }

  async queryLicense(_key: string): Promise<LicenseQuery> {
    return notImplementedQuery("queryLicense via REST API");
  }

  async activateLicense(_key: string): Promise<LicenseResult> {
    return notImplemented("activateLicense via REST API");
  }

  async deactivateLicense(_key: string): Promise<LicenseResult> {
    return notImplemented("deactivateLicense via REST API");
  }

  async resetIp(_key: string): Promise<LicenseResult> {
    return notImplemented("resetIp via REST API");
  }
}
