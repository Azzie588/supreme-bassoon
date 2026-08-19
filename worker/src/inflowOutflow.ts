interface Paydate {
  item_id: string;
  pay_date: string;
  employer: string | null;
  amount: number | null;
}

interface RecurringPayment {
  item_id: string;
  name: string;
  amount: number | null;
  due_day: number | null;
  active: number | null;
}

export interface PayPeriod {
  payDate: string;
  employer: string | null;
  inflow: number | null;
  periodStart: string;
  periodEnd: string;
  payments: { item_id: string; name: string; amount: number; dueDate: string }[];
  totalOutflow: number;
  net: number | null;
}

function parseYMD(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function daysInMonth(year: number, month0: number): number {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

/** Clamped day-of-month due date for a given due_day, in the month containing `d`. */
function dueDateInMonth(d: Date, dueDay: number): Date {
  const year = d.getUTCFullYear();
  const month0 = d.getUTCMonth();
  const clamped = Math.min(dueDay, daysInMonth(year, month0));
  return new Date(Date.UTC(year, month0, clamped));
}

/**
 * Buckets active recurring payments (keyed by day-of-month) into each pay period —
 * [this paydate, next paydate) — by walking every month touched by the period and
 * clamping each payment's due_day into that month (so e.g. due_day=31 lands on the
 * last day of a 30-day month instead of overflowing into the next one).
 */
export function computePayPeriods(
  paydates: Paydate[],
  recurringPayments: RecurringPayment[],
): PayPeriod[] {
  const sorted = [...paydates].sort((a, b) => a.pay_date.localeCompare(b.pay_date));
  const active = recurringPayments.filter((p) => p.active !== 0 && p.due_day != null);

  return sorted.map((pd, i) => {
    const periodStart = parseYMD(pd.pay_date);
    const periodEnd = i + 1 < sorted.length ? parseYMD(sorted[i + 1].pay_date) : addDays(periodStart, 15);

    const payments: PayPeriod["payments"] = [];
    // Walk each distinct (year, month) touched by [periodStart, periodEnd)
    const monthsSeen = new Set<string>();
    for (let d = new Date(periodStart); d < periodEnd; d = addDays(d, 1)) {
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
      if (monthsSeen.has(key)) continue;
      monthsSeen.add(key);
      for (const rp of active) {
        const due = dueDateInMonth(d, rp.due_day as number);
        if (due >= periodStart && due < periodEnd) {
          payments.push({
            item_id: rp.item_id,
            name: rp.name,
            amount: rp.amount ?? 0,
            dueDate: formatYMD(due),
          });
        }
      }
    }
    payments.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const totalOutflow = payments.reduce((sum, p) => sum + p.amount, 0);
    return {
      payDate: pd.pay_date,
      employer: pd.employer,
      inflow: pd.amount,
      periodStart: formatYMD(periodStart),
      periodEnd: formatYMD(addDays(periodEnd, -1)),
      payments,
      totalOutflow,
      net: pd.amount != null ? pd.amount - totalOutflow : null,
    };
  });
}
