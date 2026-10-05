import type { Request, Response } from "express";
import type { TodoService } from "./todo.service";
import {
  createTodoSchema,
  listTodosQuerySchema,
  todoIdParamsSchema,
  updateTodoSchema,
} from "./todo.schemas";

/**
 * Traduz HTTP <-> service. A validação com Zod lança ZodError, que o
 * errorHandler converte em 400; o Express 5 encaminha erros de handlers async.
 */
export class TodoController {
  constructor(private readonly service: TodoService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const filters = listTodosQuerySchema.parse(req.query);
    res.json(await this.service.list(filters));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = todoIdParamsSchema.parse(req.params);
    res.json(await this.service.getById(id));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const input = createTodoSchema.parse(req.body);
    const todo = await this.service.create(input);
    res.status(201).location(`${req.baseUrl}/${todo.id}`).json(todo);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = todoIdParamsSchema.parse(req.params);
    const input = updateTodoSchema.parse(req.body);
    res.json(await this.service.update(id, input));
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { id } = todoIdParamsSchema.parse(req.params);
    await this.service.remove(id);
    res.status(204).end();
  };
}
