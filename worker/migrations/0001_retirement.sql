-- 401(k) tracking: dated position snapshots + a standing per-paycheck contribution rule.

CREATE TABLE IF NOT EXISTS retirement_positions_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, item_id TEXT NOT NULL,
  name TEXT, ticker TEXT, shares REAL, price REAL, value REAL, account TEXT, notes TEXT
);

CREATE TABLE IF NOT EXISTS retirement_contributions (
  item_id TEXT PRIMARY KEY, label TEXT, employee_amount REAL, employee_percent REAL,
  employer_match_amount REAL, employer_match_percent REAL, frequency TEXT,
  allocation TEXT, -- JSON: { item_id: percent, ... } split across positions
  active INTEGER DEFAULT 1, notes TEXT
);
