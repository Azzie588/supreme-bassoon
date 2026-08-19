import { ListResourcePage } from "../components/ListResourcePage";
import type { ColumnConfig } from "../components/LogResourcePage";

const columns: ColumnConfig[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "amount", label: "Amount", type: "number" },
  { key: "due_date", label: "Due date", type: "date" },
  { key: "category", label: "Category", type: "text" },
  { key: "paid", label: "Paid (1/0)", type: "number" },
  { key: "notes", label: "Notes", type: "textarea" },
];

export function LargeExpenses(_props: { path?: string }) {
  return (
    <ListResourcePage
      title="Large Upcoming Expenses"
      basePath="large-expenses"
      columns={columns}
      nameOf={(r) => String(r.name ?? "Expense")}
    />
  );
}
