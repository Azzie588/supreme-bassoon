import { useEffect, useState } from "preact/hooks";
import { api, type PayPeriod } from "../api";
import { Card } from "../components/ui";
import { BarChart } from "../components/BarChart";
import { ListResourcePage } from "../components/ListResourcePage";
import type { ColumnConfig } from "../components/LogResourcePage";
import { fmtCurrency, fmtDate } from "../utils";

const paydateColumns: ColumnConfig[] = [
  { key: "pay_date", label: "Pay date", type: "date" },
  { key: "employer", label: "Employer", type: "text" },
  { key: "amount", label: "Amount", type: "number" },
  { key: "notes", label: "Notes", type: "textarea" },
];

export function InflowOutflow(_props: { path?: string }) {
  const [periods, setPeriods] = useState<PayPeriod[]>([]);

  async function loadPeriods() {
    setPeriods(await api.get<PayPeriod[]>("/inflow-outflow"));
  }

  useEffect(() => {
    loadPeriods();
  }, []);

  const upcoming = periods.filter((p) => p.periodEnd >= new Date().toISOString().slice(0, 10)).slice(0, 12);
  const labels = upcoming.map((p) => fmtDate(p.payDate));
  const series = [
    { label: "Inflow", data: upcoming.map((p) => p.inflow ?? 0), color: "#4caf7d" },
    { label: "Outflow", data: upcoming.map((p) => p.totalOutflow), color: "#e0605a" },
  ];

  return (
    <div>
      <h2>Inflow / Outflow</h2>
      <p class="muted">
        Recurring payments are bucketed into the pay period they fall in, based on each payment's due day
        of month.
      </p>

      <Card title="Projected cash flow per paycheck">
        {upcoming.length === 0 ? (
          <p class="muted">Add paydates below to see a projection.</p>
        ) : (
          <BarChart labels={labels} series={series} />
        )}
      </Card>

      <Card title="Upcoming pay periods">
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Pay date</th>
                <th>Period</th>
                <th>Inflow</th>
                <th>Payments due</th>
                <th>Outflow</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((p) => (
                <tr key={p.payDate}>
                  <td>{fmtDate(p.payDate)}</td>
                  <td>
                    {fmtDate(p.periodStart)} – {fmtDate(p.periodEnd)}
                  </td>
                  <td>{fmtCurrency(p.inflow)}</td>
                  <td>{p.payments.map((pay) => `${pay.name} (${fmtCurrency(pay.amount)})`).join(", ") || "—"}</td>
                  <td>{fmtCurrency(p.totalOutflow)}</td>
                  <td>{fmtCurrency(p.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ListResourcePage
        title="Paydates"
        basePath="paydates"
        columns={paydateColumns}
        nameOf={(r) => fmtDate(String(r.pay_date))}
        onChange={loadPeriods}
      />
    </div>
  );
}
