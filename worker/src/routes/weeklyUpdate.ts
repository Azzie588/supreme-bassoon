import { Hono } from "hono";
import type { Env } from "../types";
import { requireAuth } from "../auth";
import { getLastUpdateDate, insertWeeklyUpdateLog } from "../db";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const app = new Hono<{ Bindings: Env }>();
app.use("*", requireAuth);

app.get("/", async (c) => {
  const lastDate = await getLastUpdateDate(c.env.DB);
  const daysSince = lastDate
    ? Math.floor((Date.now() - new Date(lastDate).getTime()) / (24 * 60 * 60 * 1000))
    : null;
  const dueForUpdate = lastDate === null || Date.now() - new Date(lastDate).getTime() > WEEK_MS;
  return c.json({ lastDate, daysSince, dueForUpdate });
});

app.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}) as Record<string, unknown>);
  const notes = typeof body.notes === "string" ? body.notes : null;
  const date = new Date().toISOString().slice(0, 10);
  await insertWeeklyUpdateLog(c.env.DB, date, notes);
  return c.json({ ok: true, date }, 201);
});

export default app;
