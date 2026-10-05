import request from "supertest";
import { createTestContext, type TestContext } from "../helpers/test-context";

describe("Rate limit da API", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestContext({ rateLimitMax: 2 });
  });

  afterAll(async () => {
    await ctx.dataSource.destroy();
  });

  it("retorna 429 após exceder o limite", async () => {
    await request(ctx.app).get("/api/v1/todos").expect(200);
    await request(ctx.app).get("/api/v1/todos").expect(200);

    const res = await request(ctx.app).get("/api/v1/todos").expect(429);

    expect(res.body).toMatchObject({ error: { code: "RATE_LIMITED" } });
  });
});
