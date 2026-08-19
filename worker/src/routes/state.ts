import { Hono } from "hono";
import type { Env } from "../types";
import { requireAuth } from "../auth";
import { getAllList, getCreditScoreHistory, getLastUpdateDate, latestPerItem } from "../db";

const app = new Hono<{ Bindings: Env }>();
app.use("*", requireAuth);

/** Aggregated dashboard snapshot: current state of every section in one round trip. */
app.get("/", async (c) => {
  const db = c.env.DB;
  const [
    creditCards,
    bankAccounts,
    loans,
    retirementPositions,
    recurringPayments,
    paydates,
    largeExpenses,
    retirementContributions,
    creditScoreHistory,
    lastUpdateDate,
  ] = await Promise.all([
    latestPerItem(db, "credit_cards_log"),
    latestPerItem(db, "bank_accounts_log"),
    latestPerItem(db, "loans_log"),
    latestPerItem(db, "retirement_positions_log"),
    getAllList(db, "recurring_payments"),
    getAllList(db, "paydate_schedule"),
    getAllList(db, "large_expenses"),
    getAllList(db, "retirement_contributions"),
    getCreditScoreHistory(db),
    getLastUpdateDate(db),
  ]);

  return c.json({
    creditCards,
    bankAccounts,
    loans,
    retirementPositions,
    recurringPayments,
    paydates,
    largeExpenses,
    retirementContributions,
    creditScoreHistory,
    lastUpdateDate,
  });
});

export default app;
