import { ListResourcePage } from "../components/ListResourcePage";
import type { ColumnConfig } from "../components/LogResourcePage";

const columns: ColumnConfig[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "amount", label: "Amount", type: "number" },
  { key: "due_day", label: "Due day (1-31)", type: "number" },
  { key: "from_account", label: "From account", type: "text" },
  { key: "payment_method", label: "Payment method", type: "text" },
  { key: "category", label: "Category", type: "text" },
  { key: "notes", label: "Notes", type: "textarea" },
];

export function RecurringPayments(_props: { path?: string }) {
  return (
    <ListResourcePage
      title="Recurring Payments"
      basePath="recurring-payments"
      columns={columns}
      nameOf={(r) => String(r.name ?? "Payment")}
    />
  );
}
