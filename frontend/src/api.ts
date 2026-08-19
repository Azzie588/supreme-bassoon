const BASE = "/api";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ---- Types ----

export interface CreditCard {
  id: number;
  date: string;
  item_id: string;
  bank: string | null;
  last4: string | null;
  balance: number | null;
  limit_amount: number | null;
  apr: number | null;
  min_payment: number | null;
  actual_payment: number | null;
  autopay_setup: string | null;
  due_date: string | null;
  benefits: string | null;
  last_limit_increase_date: string | null;
  notes: string | null;
}

export interface BankAccount {
  id: number;
  date: string;
  item_id: string;
  bank: string | null;
  last4: string | null;
  balance: number | null;
  account_type: string | null;
  interest_rate: number | null;
  purpose: string | null;
  funded_by: string | null;
  notes: string | null;
}

export interface Loan {
  id: number;
  date: string;
  item_id: string;
  what: string | null;
  lender: string | null;
  balance: number | null;
  interest_rate: number | null;
  payment_amount: number | null;
  due_date: string | null;
  term: string | null;
  notes: string | null;
}

export interface CreditScoreEntry {
  id: number;
  date: string;
  score: number;
  bureau: string;
  source: string | null;
  notes: string | null;
}

export interface RecurringPayment {
  item_id: string;
  name: string;
  amount: number | null;
  due_day: number | null;
  from_account: string | null;
  payment_method: string | null;
  category: string | null;
  active: number | null;
  notes: string | null;
}

export interface Paydate {
  item_id: string;
  pay_date: string;
  employer: string | null;
  amount: number | null;
  notes: string | null;
}

export interface LargeExpense {
  item_id: string;
  name: string;
  amount: number | null;
  due_date: string | null;
  category: string | null;
  paid: number | null;
  notes: string | null;
}

export interface RetirementPosition {
  id: number;
  date: string;
  item_id: string;
  name: string | null;
  ticker: string | null;
  shares: number | null;
  price: number | null;
  value: number | null;
  account: string | null;
  notes: string | null;
}

export interface RetirementContribution {
  item_id: string;
  label: string | null;
  employee_amount: number | null;
  employee_percent: number | null;
  employer_match_amount: number | null;
  employer_match_percent: number | null;
  frequency: string | null;
  allocation: string | null;
  active: number | null;
  notes: string | null;
}

export interface PayPeriod {
  payDate: string;
  employer: string | null;
  inflow: number | null;
  periodStart: string;
  periodEnd: string;
  payments: { item_id: string; name: string; amount: number; dueDate: string }[];
  totalOutflow: number;
  net: number | null;
}

export interface DashboardState {
  creditCards: CreditCard[];
  bankAccounts: BankAccount[];
  loans: Loan[];
  retirementPositions: RetirementPosition[];
  recurringPayments: RecurringPayment[];
  paydates: Paydate[];
  largeExpenses: LargeExpense[];
  retirementContributions: RetirementContribution[];
  creditScoreHistory: CreditScoreEntry[];
  lastUpdateDate: string | null;
}
