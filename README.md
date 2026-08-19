# Money Dashboard

A single-user personal finance tracker running as a Cloudflare Worker backed by D1.
Everything is entered manually — the app never connects to a bank, card issuer, or
any third-party service.

## What it tracks

| Section | Notes |
|---|---|
| Credit cards | Balance, limit, APR, payments, autopay, due day, benefits. Utilization % and projected 30-day interest are derived, not stored. |
| Bank accounts | Balance, type, rate, purpose, how it's funded. |
| Loans | Lender, balance, rate, payment, due day, term. |
| Credit score | Dated entries per bureau and source, plotted over time. |
| Recurring payments | Amount, day of month, source account, payment method. |
| Inflow / outflow | Buckets recurring payments into each pay period from an explicit paydate list. |
| Large expenses | One-off upcoming costs, with a paid flag. |
| 401(k) | Dated position snapshots plus a standing per-paycheck contribution rule. |

A banner prompts for a weekly update once the last logged update is more than
seven days old.

## Data model

Two table shapes:

- **`*_log` tables** are append-only history keyed by `item_id`. Current state is the
  most recent row per item, so every update preserves the prior snapshot.
- **Plain tables** (`recurring_payments`, `paydate_schedule`, `large_expenses`,
  `retirement_contributions`) hold one current row per item, upserted in place.

Due dates for cards, loans, and recurring payments are stored as a **day of month**
(`19`, not `2026-07-19`) because they recur on the same day each month.

Pay dates are an explicit list rather than a recurring rule, since real payroll
schedules shift around weekends and holidays.

## Local setup

```bash
# 1. Worker config (gitignored — it holds the live database_id)
cd worker
cp wrangler.example.toml wrangler.toml
#    then fill in database_id; find it with: npx wrangler d1 list

# 2. Local secrets (gitignored)
cat > .dev.vars <<'EOF'
APP_PASSPHRASE=some-local-dev-passphrase
SESSION_SECRET=some-local-dev-secret
EOF

# 3. Install, migrate, seed fake local data
npm install
npx wrangler d1 migrations apply financial-tracker-db --local
npx wrangler d1 execute financial-tracker-db --local --file=./seed.sql

# 4. Build the frontend, then run
cd ../frontend && npm install && npm run build
cd ../worker && npx wrangler dev
```

`worker/seed.sql` contains **fake sample data for local development only**. Never run
it against the remote database.

## Deploying

```bash
cd frontend && npm run build
cd ../worker
npx wrangler d1 migrations apply financial-tracker-db --remote
npx wrangler deploy
```

Secrets are set once per worker and never live in the repo:

```bash
npx wrangler secret put APP_PASSPHRASE
npx wrangler secret put SESSION_SECRET
```

## Security

- Single shared passphrase, compared in constant time via `crypto.subtle.verify` to
  avoid leaking information through response timing.
- Session cookie is HttpOnly, Secure, SameSite=Strict, signed with HMAC-SHA256.
- Per-IP login rate limiting backed by D1: five failed attempts triggers a 15-minute
  lockout, and a correct passphrase is refused while the lockout holds.
- All queries use bound parameters. Table names in the generic helpers come only from
  fixed literals in route handlers, never from request input.
- CSP allows no external origins; all assets are bundled and served from the worker.

## Keep out of version control

This repository is public. `private/` and `worker/backups/` are gitignored and hold
account-identifying material — payroll schedules, database dumps, Cloudflare IDs.
Check `git status` before committing if you add anything to either.
