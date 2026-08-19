/**
 * Field schemas used to validate request bodies before they ever reach a SQL statement.
 * This is the only real line of defense in this app (no external account linkage to
 * cross-check against), so every write route runs its body through `validate()`.
 */

export type FieldType = "string" | "number" | "date" | "int";

export interface FieldSchema {
  [field: string]: { type: FieldType; required?: boolean };
}

export const LOG_SCHEMAS: Record<string, FieldSchema> = {
  credit_cards_log: {
    date: { type: "date", required: true },
    item_id: { type: "string" },
    bank: { type: "string" },
    last4: { type: "string" },
    balance: { type: "number" },
    limit_amount: { type: "number" },
    apr: { type: "number" },
    min_payment: { type: "number" },
    actual_payment: { type: "number" },
    autopay_setup: { type: "string" },
    due_date: { type: "string" },
    benefits: { type: "string" },
    last_limit_increase_date: { type: "string" },
    notes: { type: "string" },
  },
  bank_accounts_log: {
    date: { type: "date", required: true },
    item_id: { type: "string" },
    bank: { type: "string" },
    last4: { type: "string" },
    balance: { type: "number" },
    account_type: { type: "string" },
    interest_rate: { type: "number" },
    purpose: { type: "string" },
    funded_by: { type: "string" },
    notes: { type: "string" },
  },
  loans_log: {
    date: { type: "date", required: true },
    item_id: { type: "string" },
    what: { type: "string" },
    lender: { type: "string" },
    balance: { type: "number" },
    interest_rate: { type: "number" },
    payment_amount: { type: "number" },
    due_date: { type: "string" },
    term: { type: "string" },
    notes: { type: "string" },
  },
  retirement_positions_log: {
    date: { type: "date", required: true },
    item_id: { type: "string" },
    name: { type: "string" },
    ticker: { type: "string" },
    shares: { type: "number" },
    price: { type: "number" },
    value: { type: "number" },
    account: { type: "string" },
    notes: { type: "string" },
  },
};

export const LIST_SCHEMAS: Record<string, FieldSchema> = {
  recurring_payments: {
    item_id: { type: "string" },
    name: { type: "string", required: true },
    amount: { type: "number" },
    due_day: { type: "int" },
    from_account: { type: "string" },
    payment_method: { type: "string" },
    category: { type: "string" },
    active: { type: "int" },
    notes: { type: "string" },
  },
  paydate_schedule: {
    item_id: { type: "string" },
    pay_date: { type: "date", required: true },
    employer: { type: "string" },
    amount: { type: "number" },
    notes: { type: "string" },
  },
  large_expenses: {
    item_id: { type: "string" },
    name: { type: "string", required: true },
    amount: { type: "number" },
    due_date: { type: "date" },
    category: { type: "string" },
    paid: { type: "int" },
    notes: { type: "string" },
  },
  retirement_contributions: {
    item_id: { type: "string" },
    label: { type: "string" },
    employee_amount: { type: "number" },
    employee_percent: { type: "number" },
    employer_match_amount: { type: "number" },
    employer_match_percent: { type: "number" },
    frequency: { type: "string" },
    allocation: { type: "string" },
    active: { type: "int" },
    notes: { type: "string" },
  },
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validate(
  schema: FieldSchema,
  body: unknown,
): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const input = body as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [field, def] of Object.entries(schema)) {
    const raw = input[field];
    if (raw === undefined || raw === null || raw === "") {
      if (def.required) return { ok: false, error: `Missing required field: ${field}` };
      out[field] = null;
      continue;
    }
    switch (def.type) {
      case "string":
        if (typeof raw !== "string") return { ok: false, error: `${field} must be a string` };
        out[field] = raw;
        break;
      case "number": {
        const n = typeof raw === "number" ? raw : Number(raw);
        if (Number.isNaN(n)) return { ok: false, error: `${field} must be a number` };
        out[field] = n;
        break;
      }
      case "int": {
        const n = typeof raw === "number" ? raw : Number(raw);
        if (!Number.isInteger(n)) return { ok: false, error: `${field} must be an integer` };
        out[field] = n;
        break;
      }
      case "date":
        if (typeof raw !== "string" || !DATE_RE.test(raw)) {
          return { ok: false, error: `${field} must be a YYYY-MM-DD date string` };
        }
        out[field] = raw;
        break;
    }
  }
  return { ok: true, value: out };
}
