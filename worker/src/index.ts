import { Hono } from "hono";
import type { Env } from "./types";
import { createLogRouter } from "./routes/logResource";
import { createListRouter } from "./routes/listResource";
import authRoutes from "./routes/auth";
import creditScoreRoutes from "./routes/creditScore";
import weeklyUpdateRoutes from "./routes/weeklyUpdate";
import inflowOutflowRoutes from "./routes/inflowOutflow";
import stateRoutes from "./routes/state";

const app = new Hono<{ Bindings: Env }>();

// Security headers on every response — no external script/style origins are ever used,
// so the CSP can be locked all the way down.
app.use("*", async (c, next) => {
  await next();
  c.header(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  );
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "no-referrer");
});

app.route("/api/auth", authRoutes);
app.route("/api/credit-cards", createLogRouter("credit_cards_log"));
app.route("/api/bank-accounts", createLogRouter("bank_accounts_log"));
app.route("/api/loans", createLogRouter("loans_log"));
app.route("/api/retirement-positions", createLogRouter("retirement_positions_log"));
app.route("/api/recurring-payments", createListRouter("recurring_payments"));
app.route("/api/paydates", createListRouter("paydate_schedule"));
app.route("/api/large-expenses", createListRouter("large_expenses"));
app.route("/api/retirement-contributions", createListRouter("retirement_contributions"));
app.route("/api/credit-score", creditScoreRoutes);
app.route("/api/weekly-update", weeklyUpdateRoutes);
app.route("/api/inflow-outflow", inflowOutflowRoutes);
app.route("/api/state", stateRoutes);

// Anything else falls through to the static frontend build (ASSETS binding).
app.get("*", async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
