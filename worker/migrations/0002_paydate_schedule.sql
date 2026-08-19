-- Explicit paydate list (replaces the rule-based `paydates` table for feature 6 —
-- the real semi-monthly payroll schedule shifts around weekends/holidays, so an
-- explicit per-check-date list is more accurate than a recurring rule).
-- The old `paydates` table is left in place; drop it manually once confirmed empty
-- on the remote DB (see handoff / plan notes).

CREATE TABLE IF NOT EXISTS paydate_schedule (
  item_id TEXT PRIMARY KEY, pay_date TEXT NOT NULL, employer TEXT,
  amount REAL, notes TEXT
);
