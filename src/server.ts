import "reflect-metadata";
import { createApp } from "./app";
import { env } from "./config/env";
import { AppDataSource } from "./database/data-source";
import { logger } from "./shared/logger";

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();
  const migrations = await AppDataSource.runMigrations();
  logger.info({ migrations: migrations.length }, "Banco de dados conectado");

  const app = createApp({ dataSource: AppDataSource });

  const server = app.listen(env.PORT, (error) => {
    if (error) {
      logger.fatal({ err: error }, "Falha ao iniciar o servidor HTTP");
      process.exit(1);
    }
    logger.info(`Servidor rodando em http://localhost:${env.PORT}`);
  });

  const shutdown = (signal: NodeJS.Signals) => {
    logger.info({ signal }, "Encerrando a aplicação...");

    setTimeout(() => {
      logger.error("Encerramento forçado após timeout");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();

    server.close((error) => {
      AppDataSource.destroy()
        .catch((err: unknown) => logger.error({ err }, "Erro ao fechar o banco de dados"))
        .finally(() => process.exit(error ? 1 : 0));
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

bootstrap().catch((err: unknown) => {
  logger.fatal({ err }, "Falha ao iniciar a aplicação");
  process.exit(1);
});
