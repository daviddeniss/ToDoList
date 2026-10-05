import "reflect-metadata";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { env } from "../config/env";
import { createDataSource } from "./create-data-source";

// O SQLite cria o arquivo, mas não a pasta.
mkdirSync(path.dirname(path.resolve(env.DATABASE_PATH)), { recursive: true });

/** DataSource da aplicação. Também é usado pela CLI do TypeORM (migrations). */
export const AppDataSource = createDataSource(env.DATABASE_PATH);
