-- Adds a `source` column (e.g. "NerdWallet", "CreditKarma") distinct from `bureau`
-- (e.g. "Experian"), per the requested credit-score-tracking fields.
ALTER TABLE credit_score_log ADD COLUMN source TEXT;
