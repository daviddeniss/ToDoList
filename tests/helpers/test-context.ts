import type { Express } from "express";
import type { DataSource } from "typeorm";
import { createApp, type AppDependencies } from "../../src/app";
import { createDataSource } from "../../src/database/create-data-source";

export interface TestContext {
  app: Express;
  dataSource: DataSource;
}

/** Sobe a aplicação com um SQLite em memória, aplicando as migrations reais. */
export async function createTestContext(
  options: Omit<AppDependencies, "dataSource"> = {},
): Promise<TestContext> {
  const dataSource = createDataSource(":memory:");
  await dataSource.initialize();
  await dataSource.runMigrations();
  return { app: createApp({ dataSource, ...options }), dataSource };
}
