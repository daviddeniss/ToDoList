import type { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../errors/app-error";

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Rota ${req.method} ${req.path} não encontrada`));
}
