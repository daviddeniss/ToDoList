import request from "supertest";
import { Todo } from "../../src/modules/todos/todo.entity";
import { createTestContext, type TestContext } from "../helpers/test-context";

const BASE_URL = "/api/v1/todos";
const MISSING_ID = "6f1c1c2e-8a4e-4c55-9d9b-2f3a7b1d0c11";

interface TodoResponse {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ErrorResponse {
  error: { code: string; message: string; details?: { path: string; message: string }[] };
}

describe("API /api/v1/todos", () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    if (ctx.dataSource.isInitialized) await ctx.dataSource.destroy();
  });

  async function createTodo(title: string): Promise<TodoResponse> {
    const res = await request(ctx.app).post(BASE_URL).send({ title }).expect(201);
    return res.body as TodoResponse;
  }

  /** Insere direto no banco com datas controladas, para testar a ordenação. */
  async function seed(todos: Partial<Todo>[]): Promise<void> {
    await ctx.dataSource.getRepository(Todo).save(todos);
  }

  describe("POST /", () => {
    it("cria uma tarefa com título sem espaços nas pontas", async () => {
      const res = await request(ctx.app)
        .post(BASE_URL)
        .send({ title: "  Estudar TypeScript  " })
        .expect(201);

      const body = res.body as TodoResponse;
      expect(body).toMatchObject({ title: "Estudar TypeScript", completed: false });
      expect(body.id).toEqual(expect.any(String));
      expect(res.headers.location).toBe(`${BASE_URL}/${body.id}`);
    });

    it.each([
      ["título ausente", {}],
      ["título vazio", { title: "   " }],
      ["título longo demais", { title: "a".repeat(101) }],
      ["título que não é texto", { title: 123 }],
      ["campo desconhecido", { title: "ok", id: MISSING_ID }],
    ])("retorna 400 para %s", async (_caso, payload) => {
      const res = await request(ctx.app).post(BASE_URL).send(payload).expect(400);

      expect((res.body as ErrorResponse).error.code).toBe("VALIDATION_ERROR");
    });

    it("retorna 400 para JSON malformado", async () => {
      const res = await request(ctx.app)
        .post(BASE_URL)
        .set("Content-Type", "application/json")
        .send('{"title":')
        .expect(400);

      expect((res.body as ErrorResponse).error.code).toBe("INVALID_JSON");
    });

    it("retorna 413 para corpo grande demais", async () => {
      const res = await request(ctx.app)
        .post(BASE_URL)
        .send({ title: "a".repeat(20_000) })
        .expect(413);

      expect((res.body as ErrorResponse).error.code).toBe("PAYLOAD_TOO_LARGE");
    });
  });

  describe("GET /", () => {
    beforeEach(async () => {
      await seed([
        { title: "Comprar pão", completed: true, createdAt: new Date("2026-01-01T10:00:00Z") },
        { title: "Estudar Node", completed: false, createdAt: new Date("2026-01-02T10:00:00Z") },
        { title: "Estudar SQL", completed: true, createdAt: new Date("2026-01-03T10:00:00Z") },
        { title: "100% foco", completed: false, createdAt: new Date("2026-01-04T10:00:00Z") },
      ]);
    });

    async function list(query: Record<string, string> = {}): Promise<string[]> {
      const res = await request(ctx.app).get(BASE_URL).query(query).expect(200);
      return (res.body as TodoResponse[]).map((todo) => todo.title);
    }

    it("lista todas, das mais novas para as mais antigas, por padrão", async () => {
      await expect(list()).resolves.toEqual([
        "100% foco",
        "Estudar SQL",
        "Estudar Node",
        "Comprar pão",
      ]);
    });

    it("ordena das mais antigas para as mais novas", async () => {
      await expect(list({ sort: "oldest" })).resolves.toEqual([
        "Comprar pão",
        "Estudar Node",
        "Estudar SQL",
        "100% foco",
      ]);
    });

    it("filtra por status", async () => {
      await expect(list({ status: "completed" })).resolves.toEqual(["Estudar SQL", "Comprar pão"]);
      await expect(list({ status: "active" })).resolves.toEqual(["100% foco", "Estudar Node"]);
    });

    it("busca pelo título sem diferenciar maiúsculas", async () => {
      await expect(list({ search: "estudar" })).resolves.toEqual(["Estudar SQL", "Estudar Node"]);
    });

    it("trata % na busca como caractere literal", async () => {
      await expect(list({ search: "%" })).resolves.toEqual(["100% foco"]);
    });

    it("combina filtros", async () => {
      await expect(list({ status: "active", search: "estudar", sort: "oldest" })).resolves.toEqual([
        "Estudar Node",
      ]);
    });

    it("retorna 400 para filtros inválidos", async () => {
      await request(ctx.app).get(BASE_URL).query({ status: "foo" }).expect(400);
      await request(ctx.app).get(BASE_URL).query({ sort: "foo" }).expect(400);
    });
  });

  describe("GET /:id", () => {
    it("retorna a tarefa", async () => {
      const todo = await createTodo("Ler um livro");

      const res = await request(ctx.app).get(`${BASE_URL}/${todo.id}`).expect(200);

      expect(res.body).toEqual(todo);
    });

    it("retorna 404 quando não existe", async () => {
      const res = await request(ctx.app).get(`${BASE_URL}/${MISSING_ID}`).expect(404);

      expect((res.body as ErrorResponse).error.code).toBe("NOT_FOUND");
    });

    it("retorna 400 para id inválido", async () => {
      await request(ctx.app).get(`${BASE_URL}/abc`).expect(400);
    });
  });

  describe("PATCH /:id", () => {
    it("atualiza parcialmente", async () => {
      const todo = await createTodo("Ler um livro");

      const res = await request(ctx.app)
        .patch(`${BASE_URL}/${todo.id}`)
        .send({ completed: true })
        .expect(200);

      expect(res.body).toMatchObject({ id: todo.id, title: "Ler um livro", completed: true });
    });

    it("atualiza o título", async () => {
      const todo = await createTodo("Ler um livro");

      const res = await request(ctx.app)
        .patch(`${BASE_URL}/${todo.id}`)
        .send({ title: "Ler dois livros" })
        .expect(200);

      expect((res.body as TodoResponse).title).toBe("Ler dois livros");
    });

    it.each([
      ["corpo vazio", {}],
      ["tentativa de alterar o id", { id: MISSING_ID }],
      ["tentativa de alterar createdAt", { createdAt: "2000-01-01" }],
      ["completed não booleano", { completed: "sim" }],
    ])("retorna 400 para %s", async (_caso, payload) => {
      const todo = await createTodo("Ler um livro");

      await request(ctx.app).patch(`${BASE_URL}/${todo.id}`).send(payload).expect(400);
    });

    it("retorna 404 quando não existe", async () => {
      await request(ctx.app)
        .patch(`${BASE_URL}/${MISSING_ID}`)
        .send({ completed: true })
        .expect(404);
    });
  });

  describe("DELETE /:id", () => {
    it("remove a tarefa e retorna 404 ao repetir", async () => {
      const todo = await createTodo("Ler um livro");

      await request(ctx.app).delete(`${BASE_URL}/${todo.id}`).expect(204);
      await request(ctx.app).delete(`${BASE_URL}/${todo.id}`).expect(404);
      await request(ctx.app).get(`${BASE_URL}/${todo.id}`).expect(404);
    });
  });
});

describe("Aplicação", () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    if (ctx.dataSource.isInitialized) await ctx.dataSource.destroy();
  });

  it("GET /health retorna ok", async () => {
    await request(ctx.app).get("/health").expect(200, { status: "ok" });
  });

  it("retorna 500 sem expor detalhes quando ocorre um erro inesperado", async () => {
    await ctx.dataSource.destroy();

    const res = await request(ctx.app).get("/health").expect(500);

    expect(res.body).toEqual({
      error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" },
    });
  });

  it("retorna 404 em JSON para rotas inexistentes", async () => {
    const res = await request(ctx.app).get("/api/v1/nada").expect(404);

    expect((res.body as ErrorResponse).error.code).toBe("NOT_FOUND");
  });

  it("serve o frontend com cabeçalhos de segurança", async () => {
    const res = await request(ctx.app).get("/").expect(200).expect("Content-Type", /html/);

    expect(res.headers["content-security-policy"]).toBeDefined();
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});
