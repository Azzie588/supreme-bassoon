import { useEffect, useState } from "preact/hooks";
import { api } from "../api";
import { useForm, toNumOrNull } from "../useForm";
import { Card, Field, SortableTh, TextAreaField } from "./ui";
import { useSortable } from "../sorting";
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
  /** Underlying value to sort on, so "$9.00" and "$100.00" order numerically
   *  rather than by their formatted text. Falls back to `compute` if omitted. */
  sortValue?: (row: Row) => number | string | null;
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
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const { values, set, reset } = useForm({ date: todayISO() });

  /** Resolves a column key to the value it sorts on. `__item` is the synthetic
   *  first column rendered via `nameOf`; derived columns sort on their number. */
  function sortValueFor(row: Row, key: string): unknown {
    if (key === "__item") return props.nameOf(row);
    if (key === "date") return row.date;
    const derived = props.derivedColumns?.find((d) => d.label === key);
    if (derived) return derived.sortValue ? derived.sortValue(row) : derived.compute(row);
    return row[key];
  }

  const { sorted: sortedRows, sort, toggle } = useSortable(rows, sortValueFor);
  const historySort = useSortable(history, (row: Row, key: string) =>
    key === "date" ? row.date : row[key],
  );

  /**
   * Carries an item's current values into the form so an update only requires
   * changing what actually moved (usually just the balance). The date is
   * deliberately today's rather than the source row's — this writes a new dated
   * snapshot, it does not edit the old one.
   */
  function valuesFromRow(row: Row): Record<string, string> {
    const next: Record<string, string> = { date: todayISO(), item_id: row.item_id };
    for (const col of props.columns) {
      next[col.key] = row[col.key] == null ? "" : String(row[col.key]);
    }
    return next;
  }

  function startUpdate(row: Row) {
    setUpdatingItemId(row.item_id);
    reset(valuesFromRow(row));
    setShowForm(true);
  }

  function startNew() {
    setUpdatingItemId(null);
    reset({ date: todayISO() });
    setShowForm(true);
  }

  function closeForm() {
    setUpdatingItemId(null);
    reset({ date: todayISO() });
    setShowForm(false);
  }

  function pickItem(e: Event) {
    const itemId = (e.currentTarget as HTMLSelectElement).value;
    const row = rows.find((r) => r.item_id === itemId);
    if (row) startUpdate(row);
    else startNew();
  }

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
    closeForm();
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
        <button onClick={showForm ? closeForm : startNew}>{showForm ? "Cancel" : "Add new"}</button>
      </div>

      {showForm && (
        <Card
          title={
            updatingItemId
              ? `Update — ${props.nameOf(rows.find((r) => r.item_id === updatingItemId) as Row)}`
              : "New entry"
          }
        >
          <form onSubmit={submit}>
            {updatingItemId && (
              <p class="muted" style={{ marginTop: 0 }}>
                Current values are filled in below — change only what moved. Saving records a new
                dated snapshot and keeps the previous one in history.
              </p>
            )}
            <div class="form-grid">
              <Field label="Date" name="date" type="date" value={values.date ?? ""} onChange={set("date")} required />
              <div class="field">
                <label for="item_id">Item</label>
                <select id="item_id" name="item_id" value={values.item_id ?? ""} onChange={pickItem}>
                  <option value="">— New item —</option>
                  {rows.map((r) => (
                    <option value={r.item_id} key={r.item_id}>
                      {props.nameOf(r)}
                    </option>
                  ))}
                </select>
              </div>
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
                  <SortableTh label="Item" sortKey="__item" sort={sort} onSort={toggle} />
                  <SortableTh label="Date" sortKey="date" sort={sort} onSort={toggle} />
                  {props.columns
                    .filter((c) => c.type !== "textarea")
                    .map((c) => (
                      <SortableTh key={c.key} label={c.label} sortKey={c.key} sort={sort} onSort={toggle} />
                    ))}
                  {props.derivedColumns?.map((c) => (
                    <SortableTh key={c.label} label={c.label} sortKey={c.label} sort={sort} onSort={toggle} />
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
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
                      <button class="link" onClick={() => startUpdate(row)}>
                        Update
                      </button>
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
                  <SortableTh label="Date" sortKey="date" sort={historySort.sort} onSort={historySort.toggle} />
                  {props.columns
                    .filter((c) => c.type !== "textarea")
                    .map((c) => (
                      <SortableTh
                        key={c.key}
                        label={c.label}
                        sortKey={c.key}
                        sort={historySort.sort}
                        onSort={historySort.toggle}
                      />
                    ))}
                </tr>
              </thead>
              <tbody>
                {historySort.sorted.map((row) => (
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
