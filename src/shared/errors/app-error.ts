export interface ErrorDetail {
  path: string;
  message: string;
}

/** Erro de domínio/aplicação com status HTTP e código estável para o cliente. */
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado") {
    super(404, "NOT_FOUND", message);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Muitas requisições. Tente novamente em instantes.") {
    super(429, "RATE_LIMITED", message);
  }
}
