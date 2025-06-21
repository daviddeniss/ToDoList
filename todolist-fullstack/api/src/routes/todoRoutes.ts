import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Todo } from "../entities/Todo";

const router = Router();
const todoRepository = AppDataSource.getRepository(Todo);

// Rota GET com filtros combináveis
router.get("/", async (req: Request, res: Response) => {
  try {
    const { completed, search, sort } = req.query;
    
    const query = todoRepository.createQueryBuilder("todo");
    
    // Filtro por status
    if (completed === 'true' || completed === 'false') {
      query.andWhere("todo.completed = :completed", { 
        completed: completed === 'true' 
      });
    }

    // Filtro por busca textual
    if (typeof search === 'string' && search.trim()) {
      query.andWhere("todo.title LIKE :search", { 
        search: `%${search.trim()}%` 
      });
    }

    // Ordenação
    if (sort === 'newest') {
      query.orderBy("todo.createdAt", "DESC");
    } else if (sort === 'oldest') {
      query.orderBy("todo.createdAt", "ASC");
    }

    const todos = await query.getMany();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });
    
    const todo = todoRepository.create({ title });
    const result = await todoRepository.save(todo);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: "Invalid todo data" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const todo = await todoRepository.findOneBy({ id: req.params.id });
    if (!todo) return res.status(404).json({ error: "Todo not found" });
    
    todoRepository.merge(todo, req.body);
    const result = await todoRepository.save(todo);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: "Invalid update data" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await todoRepository.delete(req.params.id);
    if (result.affected === 0) return res.status(404).json({ error: "Todo not found" });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

export default router;