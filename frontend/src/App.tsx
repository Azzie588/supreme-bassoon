import { useEffect, useState } from "preact/hooks";
import Router from "preact-router";
import { api } from "./api";
import { Login } from "./pages/Login";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { CreditCards } from "./pages/CreditCards";
import { BankAccounts } from "./pages/BankAccounts";
import { Loans } from "./pages/Loans";
import { CreditScore } from "./pages/CreditScore";
import { RecurringPayments } from "./pages/RecurringPayments";
import { InflowOutflow } from "./pages/InflowOutflow";
import { LargeExpenses } from "./pages/LargeExpenses";
import { Retirement } from "./pages/Retirement";
import { WeeklyUpdate } from "./pages/WeeklyUpdate";

export function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    api
      .get<{ authed: boolean }>("/auth/session")
      .then((r) => setAuthed(r.authed))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) return <p class="muted" style={{ padding: 24 }}>Loading…</p>;
  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  return (
    <Layout path={path}>
      <Router onChange={(e) => setPath(e.url)}>
        <Dashboard path="/" />
        <CreditCards path="/credit-cards" />
        <BankAccounts path="/bank-accounts" />
        <Loans path="/loans" />
        <CreditScore path="/credit-score" />
        <RecurringPayments path="/recurring" />
        <InflowOutflow path="/cash-flow" />
        <LargeExpenses path="/large-expenses" />
        <Retirement path="/retirement" />
        <WeeklyUpdate path="/weekly-update" />
      </Router>
    </Layout>
  );
}
