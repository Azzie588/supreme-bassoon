export function fmtCurrency(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function fmtPercent(n: number | null | undefined, digits = 1): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(`${s}T00:00:00`);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Current balance / credit limit, as a percentage. */
export function utilization(balance: number | null, limit: number | null): number | null {
  if (balance == null || limit == null || limit === 0) return null;
  return (balance / limit) * 100;
}

/** Simple daily-interest estimate of what a balance accrues over 30 days at a given APR. */
export function interestOver30Days(balance: number | null, apr: number | null): number | null {
  if (balance == null || apr == null) return null;
  return balance * (apr / 100 / 365) * 30;
}
