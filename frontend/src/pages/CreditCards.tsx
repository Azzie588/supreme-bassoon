import { LogResourcePage, type ColumnConfig } from "../components/LogResourcePage";
import { fmtCurrency, fmtPercent, interestOver30Days, utilization } from "../utils";

const columns: ColumnConfig[] = [
  { key: "bank", label: "Bank", type: "text" },
  { key: "last4", label: "Last 4", type: "text" },
  { key: "balance", label: "Balance", type: "number" },
  { key: "limit_amount", label: "Limit", type: "number" },
  { key: "apr", label: "APR %", type: "number" },
  { key: "min_payment", label: "Min payment", type: "number" },
  { key: "actual_payment", label: "Actual payment", type: "number" },
  { key: "autopay_setup", label: "Autopay setup", type: "text" },
  { key: "due_date", label: "Due day", type: "text" },
  { key: "benefits", label: "Benefits", type: "textarea" },
  { key: "last_limit_increase_date", label: "Last limit increase", type: "date" },
  { key: "notes", label: "Notes / intent", type: "textarea" },
];

function num(v: unknown): number | null {
  return v == null ? null : Number(v);
}

export function CreditCards(_props: { path?: string }) {
  return (
    <LogResourcePage
      title="Credit Cards"
      basePath="credit-cards"
      columns={columns}
      nameOf={(r) => `${r.bank ?? "Card"} •${r.last4 ?? "----"}`}
      derivedColumns={[
        {
          label: "Utilization",
          compute: (r) => fmtPercent(utilization(num(r.balance), num(r.limit_amount))),
        },
        {
          label: "30d interest",
          compute: (r) => fmtCurrency(interestOver30Days(num(r.balance), num(r.apr))),
        },
      ]}
    />
  );
}
