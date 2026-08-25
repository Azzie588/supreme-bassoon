import { useEffect, useState } from "preact/hooks";
import { api, type CreditScoreEntry } from "../api";
import { useForm, toIntOrNull } from "../useForm";
import { Card, Field, SortableTh } from "../components/ui";
import { useSortable } from "../sorting";
import { LineChart } from "../components/LineChart";
import { fmtDate, todayISO } from "../utils";

export function CreditScore(_props: { path?: string }) {
  const [entries, setEntries] = useState<CreditScoreEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { values, set, reset } = useForm({ date: todayISO() });

  async function load() {
    setEntries(await api.get<CreditScoreEntry[]>("/credit-score"));
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: Event) {
    e.preventDefault();
    await api.post("/credit-score", {
      date: values.date,
      score: toIntOrNull(values.score),
      bureau: values.bureau,
      source: values.source || null,
    });
    reset({ date: todayISO() });
    setShowForm(false);
    await load();
  }

  const byBureau = new Map<string, CreditScoreEntry[]>();
  for (const e of entries) {
    if (!byBureau.has(e.bureau)) byBureau.set(e.bureau, []);
    byBureau.get(e.bureau)!.push(e);
  }
  const labels = Array.from(new Set(entries.map((e) => e.date))).sort();
  const colors = ["#5b8def", "#4caf7d", "#d99a3a", "#e0605a"];
  const series = Array.from(byBureau.entries()).map(([bureau, rows], i) => ({
    label: bureau,
    color: colors[i % colors.length],
    data: labels.map((l) => rows.find((r) => r.date === l)?.score ?? NaN),
  }));

  // Feed the table newest-first so that remains the default before any column
  // is clicked; the API returns entries oldest-first for the chart's benefit.
  const {
    sorted: sortedEntries,
    sort,
    toggle,
  } = useSortable([...entries].reverse(), (e: CreditScoreEntry, key: string) =>
    e[key as keyof CreditScoreEntry],
  );

  return (
    <div>
      <div class="topbar">
        <h2>Credit Score</h2>
        <button onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "Add entry"}</button>
      </div>

      {showForm && (
        <Card title="New entry">
          <form onSubmit={submit}>
            <div class="form-grid">
              <Field label="Date" name="date" type="date" value={values.date ?? ""} onChange={set("date")} required />
              <Field label="Score" name="score" type="number" value={values.score ?? ""} onChange={set("score")} required />
              <Field
                label="Bureau"
                name="bureau"
                value={values.bureau ?? ""}
                onChange={set("bureau")}
                options={["Experian", "Equifax", "TransUnion"]}
              />
              <Field label="Source" name="source" value={values.source ?? ""} onChange={set("source")} />
            </div>
            <button type="submit">Save entry</button>
          </form>
        </Card>
      )}

      <Card title="Score over time">
        {entries.length === 0 ? <p class="muted">No entries yet.</p> : <LineChart labels={labels} series={series} />}
      </Card>

      <Card title="History">
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <SortableTh label="Date" sortKey="date" sort={sort} onSort={toggle} />
                <SortableTh label="Score" sortKey="score" sort={sort} onSort={toggle} />
                <SortableTh label="Bureau" sortKey="bureau" sort={sort} onSort={toggle} />
                <SortableTh label="Source" sortKey="source" sort={sort} onSort={toggle} />
              </tr>
            </thead>
            <tbody>
              {sortedEntries.map((e) => (
                <tr key={e.id}>
                  <td>{fmtDate(e.date)}</td>
                  <td>{e.score}</td>
                  <td>{e.bureau}</td>
                  <td>{e.source ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
