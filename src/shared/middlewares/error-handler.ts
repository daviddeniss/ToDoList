import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError, type ErrorDetail } from "../errors/app-error";

interface ErrorBody {
  code: string;
  message: string;
  details?: ErrorDetail[];
}

/** Erros gerados pelo body-parser do Express (JSON malformado, corpo grande demais...). */
function isBodyParserError(err: unknown): err is { type: string; status: number } {
  return typeof err === "object" && err !== null && "type" in err && "status" in err;
}

function toErrorResponse(err: unknown): { status: number; body: ErrorBody } {
  if (err instanceof ZodError) {
    return {
      status: 400,
      body: {
        code: "VALIDATION_ERROR",
        message: "Dados inválidos",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    };
  }

  if (err instanceof AppError) {
    return {
      status: err.statusCode,
      body: { code: err.code, message: err.message, details: err.details },
    };
  }

  if (isBodyParserError(err)) {
    if (err.type === "entity.parse.failed") {
      return { status: 400, body: { code: "INVALID_JSON", message: "JSON malformado" } };
    }
    if (err.type === "entity.too.large") {
      return {
        status: 413,
        body: { code: "PAYLOAD_TOO_LARGE", message: "Corpo da requisição muito grande" },
      };
    }
  }

  return { status: 500, body: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" } };
}

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  const { status, body } = toErrorResponse(err);

  if (status >= 500) {
    req.log.error({ err }, "Erro não tratado");
  }

  res.status(status).json({ error: body });
}
