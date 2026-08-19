import { Hono } from "hono";
import type { Env } from "../types";
import { requireAuth } from "../auth";
import {
  deleteItemHistory,
  historyForItem,
  insertLogRow,
  latestPerItem,
  type LogTable,
} from "../db";
import { LOG_SCHEMAS, validate } from "../schemas";

/** CRUD router for an append-only `*_log` resource (credit cards, accounts, loans, 401k positions). */
export function createLogRouter(table: LogTable) {
  const app = new Hono<{ Bindings: Env }>();
  app.use("*", requireAuth);

  app.get("/", async (c) => {
    return c.json(await latestPerItem(c.env.DB, table));
  });

  app.get("/:itemId/history", async (c) => {
    return c.json(await historyForItem(c.env.DB, table, c.req.param("itemId")));
  });

  app.post("/", async (c) => {
    const body = await c.req.json().catch(() => null);
    const result = validate(LOG_SCHEMAS[table], body);
    if (!result.ok) return c.json({ error: result.error }, 400);
    const row = await insertLogRow(c.env.DB, table, result.value);
    return c.json(row, 201);
  });

  app.delete("/:itemId", async (c) => {
    await deleteItemHistory(c.env.DB, table, c.req.param("itemId"));
    return c.json({ ok: true });
  });

  return app;
}
