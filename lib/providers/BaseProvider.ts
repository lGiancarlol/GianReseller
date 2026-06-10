export interface TestResult {
  success: boolean;
  detail: string;
  latencyMs?: number;
  raw?: unknown;
}

export interface LicenseResult {
  success: boolean;
  licenseKey?: string;
  detail: string;
  raw?: unknown;
}

export interface CreateLicenseResult {
  success: boolean;
  licenseKey?: string;
  externalId?: string;
  raw?: unknown;
  error?: string;
}

export interface LicenseQuery {
  success: boolean;
  found: boolean;
  data?: unknown;
  detail: string;
}

// Contrato que todos los drivers deben implementar
export interface IProvider {
  testConnection(): Promise<TestResult>;
  createLicense(productId: string, externalId?: string): Promise<CreateLicenseResult>;
  requestLicense(product: string, duration: string, resellerRef?: string): Promise<LicenseResult>;
  queryLicense(licenseKey: string): Promise<LicenseQuery>;
  activateLicense(licenseKey: string, hwid?: string): Promise<LicenseResult>;
  deactivateLicense(licenseKey: string): Promise<LicenseResult>;
  resetIp(licenseKey: string): Promise<LicenseResult>;
}

// Respuesta estructurada de not implemented para metodos aun no disponibles
export function notImplemented(method: string): LicenseResult {
  return { success: false, detail: `${method} no implementado para este tipo de provider` };
}

export function notImplementedQuery(method: string): LicenseQuery {
  return { success: false, found: false, detail: `${method} no implementado para este tipo de provider` };
}
