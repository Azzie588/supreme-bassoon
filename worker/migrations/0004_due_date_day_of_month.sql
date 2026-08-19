-- Normalize credit card and loan due_date values from full dates ('2026-07-19') to
-- day-of-month ('19'), matching how recurring_payments.due_day already works and how
-- these dates actually behave (the same day carries over month to month).
--
-- The GLOB guard means only full YYYY-MM-DD values are touched: rows already stored as
-- a day-of-month, plus NULL/empty values, are left alone. That also makes this a no-op
-- when re-applied, and a no-op against the local dev database.
--
-- CAST(... AS INTEGER) strips the leading zero so '05' becomes '5'.

UPDATE credit_cards_log
SET due_date = CAST(CAST(substr(due_date, 9, 2) AS INTEGER) AS TEXT)
WHERE due_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]';

UPDATE loans_log
SET due_date = CAST(CAST(substr(due_date, 9, 2) AS INTEGER) AS TEXT)
WHERE due_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]';
