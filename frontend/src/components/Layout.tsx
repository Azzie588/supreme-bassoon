import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import type { JSX } from "preact";
import { api } from "../api";

function navigate(e: MouseEvent, href: string) {
  e.preventDefault();
  route(href);
}

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/credit-cards", label: "Credit Cards" },
  { href: "/bank-accounts", label: "Bank Accounts" },
  { href: "/loans", label: "Loans" },
  { href: "/credit-score", label: "Credit Score" },
  { href: "/recurring", label: "Recurring Payments" },
  { href: "/cash-flow", label: "Inflow / Outflow" },
  { href: "/large-expenses", label: "Large Expenses" },
  { href: "/retirement", label: "401(k)" },
];

interface WeeklyStatus {
  lastDate: string | null;
  daysSince: number | null;
  dueForUpdate: boolean;
}

export function Layout(props: { path?: string; children: JSX.Element | JSX.Element[] }) {
  const [status, setStatus] = useState<WeeklyStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    api.get<WeeklyStatus>("/weekly-update").then(setStatus).catch(() => {});
  }, [props.path]);

  async function logout() {
    await api.post("/auth/logout", {});
    window.location.reload();
  }

  return (
    <div class="layout">
      <aside class="sidebar">
        <h1>Money Dashboard</h1>
        <nav>
          {NAV.map((item) => (
            <a
              href={item.href}
              class={props.path === item.href ? "active" : ""}
              onClick={(e) => navigate(e, item.href)}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div style={{ marginTop: 24 }}>
          <button class="secondary" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main class="main">
        {status?.dueForUpdate && !dismissed && (
          <div class="banner">
            <span>
              {status.lastDate
                ? `It's been ${status.daysSince} days since your last weekly update.`
                : "You haven't logged a weekly update yet."}{" "}
              Time to refresh your numbers.
            </span>
            <div class="actions-row">
              <button onClick={() => route("/weekly-update")}>Start update</button>
              <button class="secondary" onClick={() => setDismissed(true)}>
                Dismiss
              </button>
            </div>
          </div>
        )}
        {props.children}
      </main>
    </div>
  );
}
