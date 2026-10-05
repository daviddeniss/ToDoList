import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTodos1791160914378 implements MigrationInterface {
  name = "CreateTodos1791160914378";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "todos" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar(100) NOT NULL, "completed" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT ((strftime('%Y-%m-%d %H:%M:%f', 'now'))), "updatedAt" datetime NOT NULL DEFAULT ((strftime('%Y-%m-%d %H:%M:%f', 'now'))))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a624876e942ef326e906992387" ON "todos" ("completed") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_928dac98ee6538b52954fbf108" ON "todos" ("createdAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_928dac98ee6538b52954fbf108"`);
    await queryRunner.query(`DROP INDEX "IDX_a624876e942ef326e906992387"`);
    await queryRunner.query(`DROP TABLE "todos"`);
  }
}
