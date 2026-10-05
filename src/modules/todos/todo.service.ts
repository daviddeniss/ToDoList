import { NotFoundError } from "../../shared/errors/app-error";
import type { Todo } from "./todo.entity";
import type { TodoRepository } from "./todo.repository";
import type { CreateTodoInput, ListTodosQuery, UpdateTodoInput } from "./todo.schemas";

export class TodoService {
  constructor(private readonly todos: TodoRepository) {}

  list(filters: ListTodosQuery): Promise<Todo[]> {
    return this.todos.findMany(filters);
  }

  async getById(id: string): Promise<Todo> {
    const todo = await this.todos.findById(id);
    if (!todo) throw new NotFoundError("Tarefa não encontrada");
    return todo;
  }

  create(input: CreateTodoInput): Promise<Todo> {
    return this.todos.create({ title: input.title });
  }

  async update(id: string, input: UpdateTodoInput): Promise<Todo> {
    const todo = await this.getById(id);

    if (input.title !== undefined) todo.title = input.title;
    if (input.completed !== undefined) todo.completed = input.completed;

    return this.todos.save(todo);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.todos.delete(id);
    if (!deleted) throw new NotFoundError("Tarefa não encontrada");
  }
}
