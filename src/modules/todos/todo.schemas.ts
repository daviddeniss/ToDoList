import { z } from "zod";
import { TODO_TITLE_MAX_LENGTH } from "./todo.entity";

// Mensagens padrão de validação em português.
z.config(z.locales.pt());

const titleSchema = z
  .string({ error: "O título deve ser um texto" })
  .trim()
  .min(1, "O título é obrigatório")
  .max(TODO_TITLE_MAX_LENGTH, `O título deve ter no máximo ${TODO_TITLE_MAX_LENGTH} caracteres`);

const completedSchema = z.boolean({ error: "O campo completed deve ser booleano" });

export const createTodoSchema = z.strictObject({
  title: titleSchema,
});

export const updateTodoSchema = z
  .strictObject({
    title: titleSchema.optional(),
    completed: completedSchema.optional(),
  })
  .refine((data) => data.title !== undefined || data.completed !== undefined, {
    message: "Informe ao menos um campo para atualizar (title ou completed)",
  });

export const todoIdParamsSchema = z.object({
  id: z.uuid("ID inválido"),
});

export const listTodosQuerySchema = z.object({
  status: z.enum(["all", "active", "completed"]).default("all"),
  search: z.string().trim().max(TODO_TITLE_MAX_LENGTH).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type ListTodosQuery = z.infer<typeof listTodosQuerySchema>;
