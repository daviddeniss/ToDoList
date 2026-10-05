import path from "node:path";
import { DataSource } from "typeorm";
import { Todo } from "../modules/todos/todo.entity";

/** Cria o DataSource; aceita ":memory:" para testes. */
export function createDataSource(database: string): DataSource {
  return new DataSource({
    type: "better-sqlite3",
    database,
    entities: [Todo],
    migrations: [path.join(__dirname, "migrations", "*.{ts,js}")],
    synchronize: false,
    logging: false,
  });
}
