const BASE_URL = "/api/v1/todos";

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** Faz a requisição e converte respostas de erro (4xx/5xx) em ApiError. */
async function request(path, { method = "GET", body, signal } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    signal,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = data?.error;
    const message = error?.details?.[0]?.message ?? error?.message ?? "Erro inesperado";
    throw new ApiError(message, response.status, error?.code);
  }

  return data;
}

export const todoApi = {
  list({ status, search, sort }, signal) {
    const params = new URLSearchParams({ status, sort });
    if (search) params.set("search", search);
    return request(`?${params}`, { signal });
  },

  create(title) {
    return request("", { method: "POST", body: { title } });
  },

  update(id, changes) {
    return request(`/${encodeURIComponent(id)}`, { method: "PATCH", body: changes });
  },

  remove(id) {
    return request(`/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};
