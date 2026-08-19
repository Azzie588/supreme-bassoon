-- Baseline schema matching the live production D1 database.
-- Uses IF NOT EXISTS so this is a safe no-op when applied against the existing
-- remote DB (tables already there) while still bootstrapping a fresh local DB for dev.

CREATE TABLE IF NOT EXISTS credit_cards_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, item_id TEXT NOT NULL,
  bank TEXT, last4 TEXT, balance REAL, limit_amount REAL, apr REAL, min_payment REAL,
  actual_payment REAL, autopay_setup TEXT, due_date TEXT, benefits TEXT,
  last_limit_increase_date TEXT, notes TEXT
);

CREATE TABLE IF NOT EXISTS bank_accounts_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, item_id TEXT NOT NULL,
  bank TEXT, last4 TEXT, balance REAL, account_type TEXT, interest_rate REAL,
  purpose TEXT, funded_by TEXT, notes TEXT
);

CREATE TABLE IF NOT EXISTS loans_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, item_id TEXT NOT NULL,
  what TEXT, lender TEXT, balance REAL, interest_rate REAL, payment_amount REAL,
  due_date TEXT, term TEXT, notes TEXT
);

CREATE TABLE IF NOT EXISTS credit_score_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, score INTEGER,
  bureau TEXT, notes TEXT
);

CREATE TABLE IF NOT EXISTS recurring_payments (
  item_id TEXT PRIMARY KEY, name TEXT, amount REAL, due_day INTEGER,
  from_account TEXT, payment_method TEXT, category TEXT, active INTEGER DEFAULT 1, notes TEXT
);

CREATE TABLE IF NOT EXISTS paydates (
  item_id TEXT PRIMARY KEY, employer TEXT, amount_per_check REAL, frequency TEXT,
  last_paid_date TEXT, active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS large_expenses (
  item_id TEXT PRIMARY KEY, name TEXT, amount REAL, due_date TEXT, category TEXT,
  paid INTEGER DEFAULT 0, notes TEXT
);

CREATE TABLE IF NOT EXISTS weekly_update_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, notes TEXT
);

CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT PRIMARY KEY, fail_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_ms INTEGER NOT NULL, locked_until_ms INTEGER NOT NULL DEFAULT 0
);
