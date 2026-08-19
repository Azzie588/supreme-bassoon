import { Hono } from "hono";
import type { Env } from "../types";
import { requireAuth } from "../auth";
import { getAllList } from "../db";
import { computePayPeriods } from "../inflowOutflow";

const app = new Hono<{ Bindings: Env }>();
app.use("*", requireAuth);

app.get("/", async (c) => {
  const [paydates, recurringPayments] = await Promise.all([
    getAllList(c.env.DB, "paydate_schedule"),
    getAllList(c.env.DB, "recurring_payments"),
  ]);
  return c.json(computePayPeriods(paydates as never, recurringPayments as never));
});

export default app;
