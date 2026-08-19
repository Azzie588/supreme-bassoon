import { Hono } from "hono";
import type { Env } from "../types";
import { requireAuth } from "../auth";
import { getCreditScoreHistory, insertCreditScoreEntry } from "../db";

const app = new Hono<{ Bindings: Env }>();
app.use("*", requireAuth);

app.get("/", async (c) => {
  return c.json(await getCreditScoreHistory(c.env.DB));
});

app.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return c.json({ error: "Body must be a JSON object" }, 400);
  }
  const { date, score, bureau, source, notes } = body as Record<string, unknown>;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: "date must be a YYYY-MM-DD string" }, 400);
  }
  const scoreNum = Number(score);
  if (!Number.isInteger(scoreNum) || scoreNum < 300 || scoreNum > 850) {
    return c.json({ error: "score must be an integer between 300 and 850" }, 400);
  }
  if (typeof bureau !== "string" || bureau.length === 0) {
    return c.json({ error: "bureau is required" }, 400);
  }
  await insertCreditScoreEntry(c.env.DB, {
    date,
    score: scoreNum,
    bureau,
    source: typeof source === "string" ? source : null,
    notes: typeof notes === "string" ? notes : null,
  });
  return c.json({ ok: true }, 201);
});

export default app;
