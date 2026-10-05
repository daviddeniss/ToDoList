import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

/** Timestamp com milissegundos: garante ordenação estável entre tarefas criadas no mesmo segundo. */
const NOW_WITH_MS = () => "(strftime('%Y-%m-%d %H:%M:%f', 'now'))";

export const TODO_TITLE_MAX_LENGTH = 100;

@Entity("todos")
export class Todo {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: TODO_TITLE_MAX_LENGTH })
  title!: string;

  @Index()
  @Column({ type: "boolean", default: false })
  completed!: boolean;

  @Index()
  @CreateDateColumn({ type: "datetime", default: NOW_WITH_MS })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime", default: NOW_WITH_MS })
  updatedAt!: Date;
}
