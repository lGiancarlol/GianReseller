export type ProviderType = "TELEGRAM_BOT" | "KEYAUTH" | "REST_API" | "CUSTOM";
export type ProviderStatus = "ACTIVE" | "INACTIVE";

// Configuración dinámica almacenada en el campo config (Json)
export interface ProviderConfig {
  botToken?: string;
  chatId?: string;
  apiUrl?: string;
  apiKey?: string;
  sessionString?: string;
  headers?: Record<string, string>;
  customJson?: string;
}

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  description: string | null;
  status: ProviderStatus;
  config: ProviderConfig | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderFormData {
  name: string;
  type: ProviderType;
  description: string;
  status: ProviderStatus;
  config: ProviderConfig;
}
