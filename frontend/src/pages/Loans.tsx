import { LogResourcePage, type ColumnConfig } from "../components/LogResourcePage";

const columns: ColumnConfig[] = [
  { key: "what", label: "What", type: "text" },
  { key: "lender", label: "Lender", type: "text" },
  { key: "balance", label: "Balance", type: "number" },
  { key: "interest_rate", label: "Interest rate %", type: "number" },
  { key: "payment_amount", label: "Payment amount", type: "number" },
  { key: "due_date", label: "Due day", type: "text" },
  { key: "term", label: "Term", type: "text" },
  { key: "notes", label: "Notes", type: "textarea" },
];

export function Loans(_props: { path?: string }) {
  return (
    <LogResourcePage
      title="Loans"
      basePath="loans"
      columns={columns}
      nameOf={(r) => `${r.what ?? "Loan"} (${r.lender ?? "—"})`}
    />
  );
}
