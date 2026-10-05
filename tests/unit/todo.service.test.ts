import { NotFoundError } from "../../src/shared/errors/app-error";
import type { Todo } from "../../src/modules/todos/todo.entity";
import type { TodoRepository } from "../../src/modules/todos/todo.repository";
import { TodoService } from "../../src/modules/todos/todo.service";

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: "6f1c1c2e-8a4e-4c55-9d9b-2f3a7b1d0c11",
    title: "Estudar TypeScript",
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeRepository() {
  return {
    findMany: jest.fn<Promise<Todo[]>, Parameters<TodoRepository["findMany"]>>(),
    findById: jest.fn<Promise<Todo | null>, [string]>(),
    create: jest.fn<Promise<Todo>, Parameters<TodoRepository["create"]>>(),
    save: jest.fn<Promise<Todo>, [Todo]>((todo) => Promise.resolve(todo)),
    delete: jest.fn<Promise<boolean>, [string]>(),
  };
}

describe("TodoService", () => {
  let repository: ReturnType<typeof makeRepository>;
  let service: TodoService;

  beforeEach(() => {
    repository = makeRepository();
    service = new TodoService(repository as unknown as TodoRepository);
  });

  it("lista repassando os filtros ao repositório", async () => {
    const todos = [makeTodo()];
    repository.findMany.mockResolvedValue(todos);
    const filters = { status: "active", sort: "newest", search: "ts" } as const;

    await expect(service.list(filters)).resolves.toBe(todos);
    expect(repository.findMany).toHaveBeenCalledWith(filters);
  });

  it("cria uma tarefa apenas com o título", async () => {
    const todo = makeTodo();
    repository.create.mockResolvedValue(todo);

    await expect(service.create({ title: todo.title })).resolves.toBe(todo);
    expect(repository.create).toHaveBeenCalledWith({ title: todo.title });
  });

  describe("getById", () => {
    it("retorna a tarefa encontrada", async () => {
      const todo = makeTodo();
      repository.findById.mockResolvedValue(todo);

      await expect(service.getById(todo.id)).resolves.toBe(todo);
    });

    it("lança NotFoundError quando não existe", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getById("inexistente")).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("update", () => {
    it("altera somente os campos informados", async () => {
      repository.findById.mockResolvedValue(makeTodo({ title: "Antigo", completed: false }));

      const updated = await service.update("id", { completed: true });

      expect(updated).toMatchObject({ title: "Antigo", completed: true });
      expect(repository.save).toHaveBeenCalledTimes(1);
    });

    it("altera o título", async () => {
      repository.findById.mockResolvedValue(makeTodo({ title: "Antigo" }));

      await expect(service.update("id", { title: "Novo" })).resolves.toMatchObject({
        title: "Novo",
      });
    });

    it("lança NotFoundError e não salva quando não existe", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update("id", { completed: true })).rejects.toBeInstanceOf(NotFoundError);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("remove a tarefa existente", async () => {
      repository.delete.mockResolvedValue(true);

      await expect(service.remove("id")).resolves.toBeUndefined();
    });

    it("lança NotFoundError quando nada foi removido", async () => {
      repository.delete.mockResolvedValue(false);

      await expect(service.remove("id")).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
