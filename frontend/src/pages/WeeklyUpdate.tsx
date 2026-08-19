import { useState } from "preact/hooks";
import { route } from "preact-router";
import { api } from "../api";
import { Card, TextAreaField } from "../components/ui";

const STEPS = [
  { href: "/credit-cards", label: "Credit cards — balances, payments, due dates" },
  { href: "/bank-accounts", label: "Bank accounts — current balances" },
  { href: "/loans", label: "Loans — balance and payment status" },
  { href: "/credit-score", label: "Credit score — log a new pull if you have one" },
  { href: "/recurring", label: "Recurring payments — anything new or changed" },
  { href: "/cash-flow", label: "Paydates — confirm amounts for recent checks" },
  { href: "/large-expenses", label: "Large expenses — mark anything paid, add new ones" },
  { href: "/retirement", label: "401(k) — log current position values" },
];

export function WeeklyUpdate(_props: { path?: string }) {
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);

  async function finish(e: Event) {
    e.preventDefault();
    await api.post("/weekly-update", { notes: notes || null });
    setDone(true);
  }

  if (done) {
    return (
      <Card title="Weekly update logged">
        <p>Nice — your weekly update is recorded. Come back next week.</p>
        <button onClick={() => route("/")}>Back to dashboard</button>
      </Card>
    );
  }

  return (
    <div>
      <h2>Weekly Update</h2>
      <p class="muted">Walk through each section, then mark the week complete below.</p>
      <Card title="Checklist">
        <ol>
          {STEPS.map((s) => (
            <li key={s.href} style={{ marginBottom: 6 }}>
              <a
                href={s.href}
                onClick={(e) => {
                  e.preventDefault();
                  route(s.href);
                }}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ol>
      </Card>
      <Card title="Mark this week complete">
        <form onSubmit={finish}>
          <TextAreaField
            label="Notes (optional)"
            name="notes"
            value={notes}
            onChange={(e) => setNotes((e.currentTarget as HTMLTextAreaElement).value)}
          />
          <button type="submit">Mark weekly update complete</button>
        </form>
      </Card>
    </div>
  );
}
