import { useEffect, useState } from "preact/hooks";
import { api, type DashboardState } from "../api";
import { Card, Stat } from "../components/ui";
import { fmtCurrency, fmtDate } from "../utils";

export function Dashboard(_props: { path?: string }) {
  const [state, setState] = useState<DashboardState | null>(null);

  useEffect(() => {
    api.get<DashboardState>("/state").then(setState);
  }, []);

  if (!state) return <p class="muted">Loading…</p>;

  const totalCcBalance = state.creditCards.reduce((s, c) => s + (c.balance ?? 0), 0);
  const totalCcLimit = state.creditCards.reduce((s, c) => s + (c.limit_amount ?? 0), 0);
  const totalBank = state.bankAccounts.reduce((s, a) => s + (a.balance ?? 0), 0);
  const totalLoans = state.loans.reduce((s, l) => s + (l.balance ?? 0), 0);
  const total401k = state.retirementPositions.reduce((s, p) => s + (p.value ?? 0), 0);
  const latestScore = state.creditScoreHistory[state.creditScoreHistory.length - 1];
  const unpaidExpenses = state.largeExpenses.filter((e) => !e.paid);
  const today = new Date().toISOString().slice(0, 10);
  const nextPaydate = [...state.paydates].sort((a, b) => a.pay_date.localeCompare(b.pay_date)).find((p) => p.pay_date >= today);

  return (
    <div>
      <h2>Snapshot</h2>
      <div class="grid">
        <Stat label="Total bank balance" value={fmtCurrency(totalBank)} />
        <Stat label="Credit card debt" value={fmtCurrency(totalCcBalance)} />
        <Stat
          label="Overall utilization"
          value={totalCcLimit ? `${((totalCcBalance / totalCcLimit) * 100).toFixed(1)}%` : "—"}
        />
        <Stat label="Loan balance" value={fmtCurrency(totalLoans)} />
        <Stat label="401(k) value" value={fmtCurrency(total401k)} />
        <Stat label="Latest credit score" value={latestScore ? String(latestScore.score) : "—"} />
        <Stat label="Next paydate" value={nextPaydate ? fmtDate(nextPaydate.pay_date) : "—"} />
        <Stat label="Unpaid large expenses" value={String(unpaidExpenses.length)} />
      </div>

      <Card title="Credit cards">
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Bank</th>
                <th>Balance</th>
                <th>Limit</th>
                <th>Due</th>
                <th>Note / intent</th>
              </tr>
            </thead>
            <tbody>
              {state.creditCards.map((c) => (
                <tr key={c.item_id}>
                  <td>
                    {c.bank} •{c.last4}
                  </td>
                  <td>{fmtCurrency(c.balance)}</td>
                  <td>{fmtCurrency(c.limit_amount)}</td>
                  <td>{c.due_date}</td>
                  <td>{c.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Upcoming large expenses">
        {unpaidExpenses.length === 0 ? (
          <p class="muted">Nothing outstanding.</p>
        ) : (
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Due</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {unpaidExpenses.map((e) => (
                  <tr key={e.item_id}>
                    <td>{e.name}</td>
                    <td>{fmtCurrency(e.amount)}</td>
                    <td>{fmtDate(e.due_date)}</td>
                    <td>{e.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
