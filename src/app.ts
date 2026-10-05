import express from "express";
import cors from "cors";
import todoRoutes from "./routes/todo.routes";
import { errorHandler } from "./utils/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/todos", todoRoutes);
app.use(errorHandler);

export default app;
