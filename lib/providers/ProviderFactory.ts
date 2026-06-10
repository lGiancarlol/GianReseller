import type { IProvider } from "./BaseProvider";
import { TelegramProvider } from "./TelegramProvider";
import { KeyAuthProvider } from "./KeyAuthProvider";
import { RestApiProvider } from "./RestApiProvider";
import type { ProviderConfig, ProviderType } from "@/types/provider";

export class ProviderFactory {
  static create(type: ProviderType, config: ProviderConfig): IProvider {
    switch (type) {
      case "TELEGRAM_BOT":
        return new TelegramProvider(config);
      case "KEYAUTH":
        return new KeyAuthProvider(config);
      case "REST_API":
      case "CUSTOM":
        return new RestApiProvider(config);
      default:
        throw new Error(`Tipo de provider desconocido: ${type}`);
    }
  }
}
