import { useEffect, useState } from "preact/hooks";
import { api } from "../api";
import { useForm, toNumOrNull } from "../useForm";
import { Card, Field, TextAreaField } from "./ui";
import type { ColumnConfig } from "./LogResourcePage";

type Row = Record<string, unknown> & { item_id: string };

interface Props {
  title: string;
  basePath: string;
  columns: ColumnConfig[];
  nameOf: (row: Row) => string;
  onChange?: () => void;
}

export function ListResourcePage(props: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const { values, set, reset, setValues } = useForm({});

  async function load() {
    setLoading(true);
    setRows(await api.get<Row[]>(`/${props.basePath}`));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(row: Row) {
    setEditing(row);
    const next: Record<string, string> = { item_id: row.item_id };
    for (const col of props.columns) next[col.key] = row[col.key] == null ? "" : String(row[col.key]);
    setValues(next);
    setShowForm(true);
  }

  function startNew() {
    setEditing(null);
    reset({});
    setShowForm(true);
  }

  async function submit(e: Event) {
    e.preventDefault();
    const body: Record<string, unknown> = { item_id: values.item_id || undefined };
    for (const col of props.columns) {
      const raw = values[col.key];
      body[col.key] = col.type === "number" ? toNumOrNull(raw) : raw || null;
    }
    await api.put(`/${props.basePath}`, body);
    reset({});
    setShowForm(false);
    setEditing(null);
    await load();
    props.onChange?.();
  }

  async function deleteItem(itemId: string) {
    if (!confirm("Delete this entry?")) return;
    await api.del(`/${props.basePath}/${itemId}`);
    await load();
    props.onChange?.();
  }

  return (
    <div>
      <div class="topbar">
        <h2>{props.title}</h2>
        <button onClick={showForm ? () => setShowForm(false) : startNew}>{showForm ? "Cancel" : "Add"}</button>
      </div>

      {showForm && (
        <Card title={editing ? "Edit entry" : "New entry"}>
          <form onSubmit={submit}>
            <div class="form-grid">
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
            <button type="submit">Save</button>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <p class="muted">Loading…</p>
        ) : rows.length === 0 ? (
          <p class="muted">Nothing here yet.</p>
        ) : (
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  {props.columns
                    .filter((c) => c.type !== "textarea")
                    .map((c) => (
                      <th key={c.key}>{c.label}</th>
                    ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.item_id}>
                    <td>{props.nameOf(row)}</td>
                    {props.columns
                      .filter((c) => c.type !== "textarea")
                      .map((c) => (
                        <td key={c.key}>{String(row[c.key] ?? "—")}</td>
                      ))}
                    <td>
                      <button class="link" onClick={() => startEdit(row)}>
                        Edit
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
    </div>
  );
}
