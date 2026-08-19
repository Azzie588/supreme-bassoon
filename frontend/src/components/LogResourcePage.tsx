import { useEffect, useState } from "preact/hooks";
import { api } from "../api";
import { useForm, toNumOrNull } from "../useForm";
import { Card, Field, TextAreaField } from "./ui";
import { fmtDate, todayISO } from "../utils";

export interface ColumnConfig {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  options?: string[];
  numeric?: boolean;
}

type Row = Record<string, unknown> & { id: number; item_id: string; date: string };

interface DerivedColumn {
  label: string;
  compute: (row: Row) => string;
}

interface Props {
  title: string;
  basePath: string; // e.g. "credit-cards"
  columns: ColumnConfig[];
  derivedColumns?: DerivedColumn[];
  nameOf: (row: Row) => string; // how to label an item in the table's first column
  onChange?: () => void;
}

export function LogResourcePage(props: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyFor, setHistoryFor] = useState<Row | null>(null);
  const [history, setHistory] = useState<Row[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { values, set, reset } = useForm({ date: todayISO() });

  async function load() {
    setLoading(true);
    const data = await api.get<Row[]>(`/${props.basePath}`);
    setRows(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function openHistory(row: Row) {
    setHistoryFor(row);
    const data = await api.get<Row[]>(`/${props.basePath}/${row.item_id}/history`);
    setHistory(data);
  }

  async function submit(e: Event) {
    e.preventDefault();
    const body: Record<string, unknown> = { date: values.date, item_id: values.item_id || undefined };
    for (const col of props.columns) {
      const raw = values[col.key];
      body[col.key] = col.type === "number" ? toNumOrNull(raw) : raw || null;
    }
    await api.post(`/${props.basePath}`, body);
    reset({ date: todayISO() });
    setShowForm(false);
    await load();
    props.onChange?.();
  }

  async function deleteItem(itemId: string) {
    if (!confirm("Delete all history for this item? This cannot be undone.")) return;
    await api.del(`/${props.basePath}/${itemId}`);
    await load();
    props.onChange?.();
  }

  return (
    <div>
      <div class="topbar">
        <h2>{props.title}</h2>
        <button onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "Add entry"}</button>
      </div>

      {showForm && (
        <Card title="New entry">
          <form onSubmit={submit}>
            <div class="form-grid">
              <Field label="Date" name="date" type="date" value={values.date ?? ""} onChange={set("date")} required />
              <Field
                label="Item (existing item_id, blank = new)"
                name="item_id"
                value={values.item_id ?? ""}
                onChange={set("item_id")}
                options={Array.from(new Set(rows.map((r) => r.item_id)))}
              />
              {props.columns.map((col) =>
                col.type === "textarea" ? (
                  <TextAreaField
                    key={col.key}
                    label={col.label}
                    name={col.key}
                    value={values[col.key] ?? ""}
                    onChange={set(col.key)}
                  />
                ) : (
                  <Field
                    key={col.key}
                    label={col.label}
                    name={col.key}
                    type={col.type === "number" ? "number" : col.type === "date" ? "date" : "text"}
                    step={col.type === "number" ? "any" : undefined}
                    value={values[col.key] ?? ""}
                    onChange={set(col.key)}
                    options={col.options}
                  />
                ),
              )}
            </div>
            <button type="submit">Save entry</button>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <p class="muted">Loading…</p>
        ) : rows.length === 0 ? (
          <p class="muted">No entries yet.</p>
        ) : (
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Date</th>
                  {props.columns
                    .filter((c) => c.type !== "textarea")
                    .map((c) => (
                      <th key={c.key}>{c.label}</th>
                    ))}
                  {props.derivedColumns?.map((c) => <th key={c.label}>{c.label}</th>)}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.item_id}>
                    <td>{props.nameOf(row)}</td>
                    <td>{fmtDate(row.date)}</td>
                    {props.columns
                      .filter((c) => c.type !== "textarea")
                      .map((c) => (
                        <td key={c.key}>{String(row[c.key] ?? "—")}</td>
                      ))}
                    {props.derivedColumns?.map((c) => <td key={c.label}>{c.compute(row)}</td>)}
                    <td>
                      <button class="link" onClick={() => openHistory(row)}>
                        History
                      </button>
                      <button class="link" onClick={() => deleteItem(row.item_id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {historyFor && (
        <Card title={`History — ${props.nameOf(historyFor)}`}>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  {props.columns
                    .filter((c) => c.type !== "textarea")
                    .map((c) => (
                      <th key={c.key}>{c.label}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id}>
                    <td>{fmtDate(row.date)}</td>
                    {props.columns
                      .filter((c) => c.type !== "textarea")
                      .map((c) => (
                        <td key={c.key}>{String(row[c.key] ?? "—")}</td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button class="secondary" onClick={() => setHistoryFor(null)} style={{ marginTop: 10 }}>
            Close
          </button>
        </Card>
      )}
    </div>
  );
}
