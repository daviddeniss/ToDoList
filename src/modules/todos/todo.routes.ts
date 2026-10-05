import { Router } from "express";
import type { DataSource } from "typeorm";
import { TodoController } from "./todo.controller";
import { TodoRepository } from "./todo.repository";
import { TodoService } from "./todo.service";

export function createTodoRouter(dataSource: DataSource): Router {
  const controller = new TodoController(new TodoService(new TodoRepository(dataSource)));
  const router = Router();

  router.get("/", controller.list);
  router.post("/", controller.create);
  router.get("/:id", controller.getById);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.remove);

  return router;
}
