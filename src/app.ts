import path from "node:path";
import cors from "cors";
import express, { type Express } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { DataSource } from "typeorm";
import { env } from "./config/env";
import { createTodoRouter } from "./modules/todos/todo.routes";
import { TooManyRequestsError } from "./shared/errors/app-error";
import { logger } from "./shared/logger";
import { errorHandler } from "./shared/middlewares/error-handler";
import { notFound } from "./shared/middlewares/not-found";

export interface AppDependencies {
  dataSource: DataSource;
}

const PUBLIC_DIR = path.join(__dirname, "..", "public");

export function createApp({ dataSource }: AppDependencies): Express {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: {
        // Em http://localhost o upgrade para https quebraria o carregamento dos assets.
        directives: { "upgrade-insecure-requests": env.NODE_ENV === "production" ? [] : null },
      },
    }),
  );
  if (env.CORS_ORIGIN.length > 0) {
    app.use(cors({ origin: env.CORS_ORIGIN }));
  }
  app.use(pinoHttp({ logger }));
  app.use(express.json({ limit: "10kb" }));

  app.get("/health", async (_req, res) => {
    await dataSource.query("SELECT 1");
    res.json({ status: "ok" });
  });

  app.use(
    "/api",
    rateLimit({
      windowMs: 60 * 1000,
      limit: env.RATE_LIMIT_MAX,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      handler: (_req, _res, next) => next(new TooManyRequestsError()),
    }),
  );
  app.use("/api/v1/todos", createTodoRouter(dataSource));

  app.use(express.static(PUBLIC_DIR));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
