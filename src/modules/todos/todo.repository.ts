import type { DataSource, Repository } from "typeorm";
import { Todo } from "./todo.entity";
import type { ListTodosQuery } from "./todo.schemas";

/** Escapa os curingas do LIKE para que "%" e "_" digitados pelo usuário sejam literais. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export class TodoRepository {
  private readonly repository: Repository<Todo>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Todo);
  }

  findMany({ status, search, sort }: ListTodosQuery): Promise<Todo[]> {
    const query = this.repository.createQueryBuilder("todo");

    if (status !== "all") {
      query.andWhere("todo.completed = :completed", { completed: status === "completed" });
    }

    if (search) {
      query.andWhere("todo.title LIKE :search ESCAPE '\\'", { search: `%${escapeLike(search)}%` });
    }

    return query.orderBy("todo.createdAt", sort === "oldest" ? "ASC" : "DESC").getMany();
  }

  findById(id: string): Promise<Todo | null> {
    return this.repository.findOneBy({ id });
  }

  create(data: Pick<Todo, "title">): Promise<Todo> {
    return this.repository.save(this.repository.create(data));
  }

  save(todo: Todo): Promise<Todo> {
    return this.repository.save(todo);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
