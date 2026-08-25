import { useEffect, useState } from "preact/hooks";
import { api, type RetirementPosition } from "../api";
import { Card, Stat } from "../components/ui";
import { LineChart } from "../components/LineChart";
import { LogResourcePage } from "../components/LogResourcePage";
import type { ColumnConfig } from "../components/LogResourcePage";
import { ListResourcePage } from "../components/ListResourcePage";
import { fmtCurrency } from "../utils";

const positionColumns: ColumnConfig[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "ticker", label: "Ticker", type: "text" },
  { key: "shares", label: "Shares", type: "number" },
  { key: "price", label: "Price", type: "number" },
  { key: "value", label: "Value", type: "number" },
  { key: "account", label: "Account", type: "text" },
  { key: "notes", label: "Notes", type: "textarea" },
];

const contributionColumns: ColumnConfig[] = [
  { key: "label", label: "Label", type: "text" },
  { key: "employee_amount", label: "Employee $ / check", type: "number" },
  { key: "employee_percent", label: "Employee %", type: "number" },
  { key: "employer_match_amount", label: "Employer match $", type: "number" },
  { key: "employer_match_percent", label: "Employer match %", type: "number" },
  { key: "frequency", label: "Frequency", type: "text" },
  { key: "allocation", label: "Allocation (JSON item_id:pct)", type: "text" },
  { key: "notes", label: "Notes", type: "textarea" },
];

export function Retirement(_props: { path?: string }) {
  const [totalHistory, setTotalHistory] = useState<{ date: string; total: number }[]>([]);

  async function loadChart() {
    const latest = await api.get<RetirementPosition[]>("/retirement-positions");
    const allRows: RetirementPosition[] = [];
    for (const item of latest) {
      const history = await api.get<RetirementPosition[]>(`/retirement-positions/${item.item_id}/history`);
      allRows.push(...history);
    }
    const byDate = new Map<string, number>();
    for (const row of allRows) {
      byDate.set(row.date, (byDate.get(row.date) ?? 0) + (row.value ?? 0));
    }
    const dates = Array.from(byDate.keys()).sort();
    setTotalHistory(dates.map((d) => ({ date: d, total: byDate.get(d) ?? 0 })));
  }

  useEffect(() => {
    loadChart();
  }, []);

  const currentTotal = totalHistory.length > 0 ? totalHistory[totalHistory.length - 1].total : 0;

  return (
    <div>
      <h2>401(k) / Retirement</h2>

      <div class="grid">
        <Stat label="Current total value" value={fmtCurrency(currentTotal)} />
      </div>

      <Card title="Value over time">
        {totalHistory.length === 0 ? (
          <p class="muted">No position snapshots yet.</p>
        ) : (
          <LineChart
            labels={totalHistory.map((h) => h.date)}
            series={[{ label: "Total value", data: totalHistory.map((h) => h.total), color: "#5b8def" }]}
          />
        )}
      </Card>

      <LogResourcePage
        title="Positions"
        basePath="retirement-positions"
        columns={positionColumns}
        nameOf={(r) => `${r.name ?? "Position"}${r.account ? ` (${r.account})` : ""}`}
        onChange={loadChart}
      />

      <ListResourcePage
        title="Contribution rules"
        basePath="retirement-contributions"
        columns={contributionColumns}
      />
    </div>
  );
}
