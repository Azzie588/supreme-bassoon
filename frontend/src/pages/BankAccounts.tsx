import { LogResourcePage, type ColumnConfig } from "../components/LogResourcePage";

const columns: ColumnConfig[] = [
  { key: "bank", label: "Bank", type: "text" },
  { key: "last4", label: "Last 4", type: "text" },
  { key: "balance", label: "Balance", type: "number" },
  { key: "account_type", label: "Type", type: "select", options: ["Checking", "Savings", "Money Market", "CD", "Other"] },
  { key: "interest_rate", label: "Interest rate %", type: "number" },
  { key: "purpose", label: "Purpose", type: "text" },
  { key: "funded_by", label: "Funded by", type: "text" },
  { key: "notes", label: "Notes", type: "textarea" },
];

export function BankAccounts(_props: { path?: string }) {
  return (
    <LogResourcePage
      title="Bank Accounts"
      basePath="bank-accounts"
      columns={columns}
      nameOf={(r) => `${r.bank ?? "Account"} •${r.last4 ?? "----"}`}
    />
  );
}
