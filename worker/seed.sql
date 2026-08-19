-- Local-dev-only seed data. Never run against the remote/production DB.
-- Includes: the real 2026 payroll check dates (from the payroll schedule PDF, amounts
-- left NULL for manual entry) plus fake sample rows for every other section so the UI
-- can be exercised end-to-end locally.

DELETE FROM paydate_schedule;
INSERT INTO paydate_schedule (item_id, pay_date, employer, amount, notes) VALUES
  ('pd-2026-01', '2026-01-02', 'Employer', NULL, NULL),
  ('pd-2026-02', '2026-01-16', 'Employer', NULL, NULL),
  ('pd-2026-03', '2026-02-02', 'Employer', NULL, NULL),
  ('pd-2026-04', '2026-02-13', 'Employer', NULL, NULL),
  ('pd-2026-05', '2026-03-02', 'Employer', NULL, NULL),
  ('pd-2026-06', '2026-03-16', 'Employer', NULL, NULL),
  ('pd-2026-07', '2026-04-01', 'Employer', NULL, NULL),
  ('pd-2026-08', '2026-04-16', 'Employer', NULL, NULL),
  ('pd-2026-09', '2026-05-01', 'Employer', NULL, NULL),
  ('pd-2026-10', '2026-05-15', 'Employer', NULL, NULL),
  ('pd-2026-11', '2026-06-01', 'Employer', NULL, NULL),
  ('pd-2026-12', '2026-06-16', 'Employer', NULL, NULL),
  ('pd-2026-13', '2026-07-01', 'Employer', NULL, NULL),
  ('pd-2026-14', '2026-07-16', 'Employer', NULL, NULL),
  ('pd-2026-15', '2026-08-03', 'Employer', NULL, NULL),
  ('pd-2026-16', '2026-08-14', 'Employer', NULL, NULL),
  ('pd-2026-17', '2026-09-01', 'Employer', NULL, NULL),
  ('pd-2026-18', '2026-09-16', 'Employer', NULL, NULL),
  ('pd-2026-19', '2026-10-01', 'Employer', NULL, NULL),
  ('pd-2026-20', '2026-10-16', 'Employer', NULL, NULL),
  ('pd-2026-21', '2026-11-02', 'Employer', NULL, NULL),
  ('pd-2026-22', '2026-11-16', 'Employer', NULL, NULL),
  ('pd-2026-23', '2026-12-01', 'Employer', NULL, NULL),
  ('pd-2026-24', '2026-12-16', 'Employer', NULL, NULL);

DELETE FROM credit_cards_log;
INSERT INTO credit_cards_log (date, item_id, bank, last4, balance, limit_amount, apr, min_payment, actual_payment, autopay_setup, due_date, benefits, last_limit_increase_date, notes) VALUES
  ('2026-08-04', 'cc-1', 'Chase', '4321', 1200.50, 8000, 22.99, 35, 200, 'Autopay minimum on due date', '15', '2% cashback groceries', '2025-11-01', 'Daily driver card'),
  ('2026-08-04', 'cc-2', 'Amex', '9981', 0, 5000, 19.99, 0, 0, 'No autopay set', '3', 'Travel points', '2024-06-01', 'Emergencies only');

DELETE FROM bank_accounts_log;
INSERT INTO bank_accounts_log (date, item_id, bank, last4, balance, account_type, interest_rate, purpose, funded_by, notes) VALUES
  ('2026-08-04', 'ba-1', 'Ally', '5567', 12500.00, 'Savings', 4.20, 'Emergency fund', 'Auto-transfer from checking', NULL),
  ('2026-08-04', 'ba-2', 'Chase', '1122', 2300.00, 'Checking', 0.01, 'Primary spending', 'Direct deposit', NULL);

DELETE FROM loans_log;
INSERT INTO loans_log (date, item_id, what, lender, balance, interest_rate, payment_amount, due_date, term, notes) VALUES
  ('2026-08-04', 'ln-1', 'Auto loan', 'Toyota Financial', 14200.00, 5.9, 320.00, '10', '60mo', NULL);

DELETE FROM credit_score_log;
INSERT INTO credit_score_log (date, score, bureau, source, notes) VALUES
  ('2026-05-01', 712, 'Experian', 'NerdWallet', NULL),
  ('2026-06-01', 718, 'Experian', 'NerdWallet', NULL),
  ('2026-07-01', 725, 'Experian', 'NerdWallet', NULL),
  ('2026-08-01', 730, 'Experian', 'NerdWallet', NULL);

DELETE FROM recurring_payments;
INSERT INTO recurring_payments (item_id, name, amount, due_day, from_account, payment_method, category, active, notes) VALUES
  ('rp-1', 'Rent', 1500, 1, 'Chase Checking', 'ACH autopay', 'Housing', 1, NULL),
  ('rp-2', 'Car insurance', 110, 12, 'Chase Checking', 'Autopay', 'Insurance', 1, NULL),
  ('rp-3', 'Streaming bundle', 35, 20, 'Amex', 'Autopay', 'Subscriptions', 1, NULL);

DELETE FROM large_expenses;
INSERT INTO large_expenses (item_id, name, amount, due_date, category, paid, notes) VALUES
  ('le-1', 'Car registration', 220, '2026-09-15', 'Auto', 0, NULL),
  ('le-2', 'Dental work', 900, '2026-10-01', 'Medical', 0, NULL);

DELETE FROM retirement_positions_log;
INSERT INTO retirement_positions_log (date, item_id, name, ticker, shares, price, value, account, notes) VALUES
  ('2026-07-01', 'rt-1', 'Target Date 2055 Fund', 'FDKLX', 100, 25.00, 2500.00, '401k', NULL),
  ('2026-08-01', 'rt-1', 'Target Date 2055 Fund', 'FDKLX', 102, 25.50, 2601.00, '401k', NULL);

DELETE FROM retirement_contributions;
INSERT INTO retirement_contributions (item_id, label, employee_amount, employee_percent, employer_match_amount, employer_match_percent, frequency, allocation, active, notes) VALUES
  ('rc-1', 'Standard contribution', NULL, 6, NULL, 3, 'per-paycheck', '{"rt-1": 100}', 1, NULL);

DELETE FROM weekly_update_log;
INSERT INTO weekly_update_log (date, notes) VALUES ('2026-08-04', 'seed');
