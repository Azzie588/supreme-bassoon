/**
 * Generic helpers for the two table shapes used throughout this app:
 *  - "log" tables (`*_log`): append-only history per item_id, "current" = latest row per item.
 *  - "list" tables (plain, single row per item_id): upserted in place.
 * Table names below are always literal strings from route handlers, never request input,
 * so interpolating them into SQL (D1 doesn't support parameterized identifiers) is safe.
 */

export const LOG_TABLES = [
  "credit_cards_log",
  "bank_accounts_log",
  "loans_log",
  "retirement_positions_log",
] as const;
export type LogTable = (typeof LOG_TABLES)[number];

export const LIST_TABLES = [
  "recurring_payments",
  "paydate_schedule",
  "large_expenses",
  "retirement_contributions",
] as const;
export type ListTable = (typeof LIST_TABLES)[number];

type Row = Record<string, unknown>;

export async function latestPerItem(db: D1Database, table: LogTable): Promise<Row[]> {
  const { results } = await db
    .prepare(
      `SELECT t.* FROM ${table} t
       WHERE t.id = (
         SELECT id FROM ${table} t2
         WHERE t2.item_id = t.item_id
         ORDER BY date DESC, id DESC LIMIT 1
       )
       ORDER BY t.item_id`,
    )
    .all<Row>();
  return results;
}

export async function historyForItem(
  db: D1Database,
  table: LogTable,
  itemId: string,
): Promise<Row[]> {
  const { results } = await db
    .prepare(`SELECT * FROM ${table} WHERE item_id = ? ORDER BY date DESC, id DESC`)
    .bind(itemId)
    .all<Row>();
  return results;
}

/** Inserts a new dated row. Generates item_id via crypto.randomUUID() if not provided. */
export async function insertLogRow(
  db: D1Database,
  table: LogTable,
  row: Row,
): Promise<{ item_id: string; id: number }> {
  const itemId = (row.item_id as string) || crypto.randomUUID();
  const fields: Row = { ...row, item_id: itemId };
  const columns = Object.keys(fields);
  const placeholders = columns.map(() => "?").join(", ");
  const result = await db
    .prepare(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`)
    .bind(...columns.map((c) => fields[c]))
    .run();
  return { item_id: itemId, id: result.meta.last_row_id as number };
}

export async function updateLogRowById(
  db: D1Database,
  table: LogTable,
  id: number,
  fields: Row,
): Promise<void> {
  const columns = Object.keys(fields);
  if (columns.length === 0) return;
  const setClause = columns.map((c) => `${c} = ?`).join(", ");
  await db
    .prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`)
    .bind(...columns.map((c) => fields[c]), id)
    .run();
}

export async function deleteItemHistory(
  db: D1Database,
  table: LogTable,
  itemId: string,
): Promise<void> {
  await db.prepare(`DELETE FROM ${table} WHERE item_id = ?`).bind(itemId).run();
}

export async function getAllList(db: D1Database, table: ListTable): Promise<Row[]> {
  const { results } = await db.prepare(`SELECT * FROM ${table}`).all<Row>();
  return results;
}

/** Insert-or-replace a single-row-per-item "list" table entry, keyed on item_id. */
export async function upsertListRow(
  db: D1Database,
  table: ListTable,
  row: Row,
): Promise<{ item_id: string }> {
  const itemId = (row.item_id as string) || crypto.randomUUID();
  const fields: Row = { ...row, item_id: itemId };
  const columns = Object.keys(fields);
  const placeholders = columns.map(() => "?").join(", ");
  await db
    .prepare(`INSERT OR REPLACE INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`)
    .bind(...columns.map((c) => fields[c]))
    .run();
  return { item_id: itemId };
}

export async function deleteListRow(db: D1Database, table: ListTable, itemId: string): Promise<void> {
  await db.prepare(`DELETE FROM ${table} WHERE item_id = ?`).bind(itemId).run();
}

export async function getLastUpdateDate(db: D1Database): Promise<string | null> {
  const row = await db
    .prepare("SELECT date FROM weekly_update_log ORDER BY date DESC, id DESC LIMIT 1")
    .first<{ date: string }>();
  return row?.date ?? null;
}

export async function insertWeeklyUpdateLog(
  db: D1Database,
  date: string,
  notes: string | null,
): Promise<void> {
  await db
    .prepare("INSERT INTO weekly_update_log (date, notes) VALUES (?, ?)")
    .bind(date, notes)
    .run();
}

export async function getCreditScoreHistory(db: D1Database): Promise<Row[]> {
  const { results } = await db
    .prepare("SELECT * FROM credit_score_log ORDER BY date ASC, id ASC")
    .all<Row>();
  return results;
}

export async function insertCreditScoreEntry(
  db: D1Database,
  row: { date: string; score: number; bureau: string; source?: string | null; notes?: string | null },
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO credit_score_log (date, score, bureau, source, notes) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(row.date, row.score, row.bureau, row.source ?? null, row.notes ?? null)
    .run();
}
