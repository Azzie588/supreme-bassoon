import { Hono } from "hono";
import type { Env } from "../types";
import { requireAuth } from "../auth";
import { deleteListRow, getAllList, upsertListRow, type ListTable } from "../db";
import { LIST_SCHEMAS, validate } from "../schemas";

/** CRUD router for a single-row-per-item "list" resource (recurring payments, paydates, etc). */
export function createListRouter(table: ListTable) {
  const app = new Hono<{ Bindings: Env }>();
  app.use("*", requireAuth);

  app.get("/", async (c) => {
    return c.json(await getAllList(c.env.DB, table));
  });

  app.put("/", async (c) => {
    const body = await c.req.json().catch(() => null);
    const result = validate(LIST_SCHEMAS[table], body);
    if (!result.ok) return c.json({ error: result.error }, 400);
    const row = await upsertListRow(c.env.DB, table, result.value);
    return c.json(row, 200);
  });

  app.delete("/:itemId", async (c) => {
    await deleteListRow(c.env.DB, table, c.req.param("itemId"));
    return c.json({ ok: true });
  });

  return app;
}
