import pino, { type TransportSingleOptions } from "pino";
import { env } from "../config/env";

/** Usa pino-pretty em desenvolvimento, se estiver instalado (é dependência de dev). */
function prettyTransport(): TransportSingleOptions | undefined {
  if (env.NODE_ENV !== "development") return undefined;
  try {
    require.resolve("pino-pretty");
    return { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss" } };
  } catch {
    return undefined;
  }
}

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : env.LOG_LEVEL,
  transport: prettyTransport(),
});
