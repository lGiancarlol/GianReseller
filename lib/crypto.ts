import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import type { ProviderConfig } from "@/types/provider";

// Campos que se cifran antes de almacenar en la base de datos
const SENSITIVE_FIELDS: (keyof ProviderConfig)[] = [
  "botToken",
  "apiKey",
  "sessionString",
  "password",
  "bearerToken",
];

const ALGORITHM = "aes-256-gcm";
const ENC_PREFIX = "enc:";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("ENCRYPTION_KEY debe ser una cadena hexadecimal de 64 caracteres (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

// Cifra un string y retorna "enc:IV:AUTH_TAG:CIPHERTEXT" en hex
function encryptValue(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96 bits recomendado para GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENC_PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

// Descifra un valor con formato "enc:IV:AUTH_TAG:CIPHERTEXT"
function decryptValue(ciphertext: string): string {
  if (!ciphertext.startsWith(ENC_PREFIX)) return ciphertext;

  const parts = ciphertext.slice(ENC_PREFIX.length).split(":");
  if (parts.length !== 3) throw new Error("Formato de valor cifrado invalido");

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

// Retorna true si el valor ya esta cifrado
export function isEncrypted(value: string): boolean {
  return value.startsWith(ENC_PREFIX);
}

// Cifra todos los campos sensibles de un ProviderConfig
// Si el valor ya esta cifrado (no cambio), lo deja intacto
export function encryptConfig(config: ProviderConfig): ProviderConfig {
  const result = { ...config };

  for (const field of SENSITIVE_FIELDS) {
    const value = result[field];
    if (typeof value === "string" && value.length > 0 && !isEncrypted(value)) {
      (result as Record<string, unknown>)[field] = encryptValue(value);
    }
  }

  return result;
}

// Descifra todos los campos sensibles de un ProviderConfig
export function decryptConfig(config: ProviderConfig): ProviderConfig {
  const result = { ...config };

  for (const field of SENSITIVE_FIELDS) {
    const value = result[field];
    if (typeof value === "string" && isEncrypted(value)) {
      try {
        (result as Record<string, unknown>)[field] = decryptValue(value);
      } catch {
        // Si falla el descifrado, dejar el valor cifrado para no perder datos
        console.error(`Error descifrando campo ${field}`);
      }
    }
  }

  return result;
}

// Retorna una mascara para campos sensibles que ya estan almacenados
// Usar en formularios para no exponer ni enviar el valor real
export function maskConfig(config: ProviderConfig): ProviderConfig {
  const result = { ...config };

  for (const field of SENSITIVE_FIELDS) {
    const value = result[field];
    if (typeof value === "string" && isEncrypted(value)) {
      (result as Record<string, unknown>)[field] = "********";
    }
  }

  return result;
}
