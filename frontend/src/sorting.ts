import { useMemo, useState } from "preact/hooks";

export type SortDir = "asc" | "desc";

export interface SortState {
  key: string | null;
  dir: SortDir;
}

export const NO_SORT: SortState = { key: null, dir: "asc" };

export function isBlank(v: unknown): boolean {
  return v === null || v === undefined || v === "";
}

/**
 * Orders two non-blank cell values without knowing their column's declared type.
 * Anything numeric compares numerically, so balances of 9 and 100 order correctly
 * rather than lexically. Everything else falls back to a locale compare with
 * numeric collation, which keeps ISO dates ("2026-08-04" < "2026-08-19") in
 * chronological order for free.
 *
 * Blanks are deliberately NOT handled here — see `useSortable`, which keeps them
 * pinned to the bottom in both directions rather than letting them flip to the
 * top when the comparison is negated.
 */
export function compareValues(a: unknown, b: unknown): number {
  const aNum = typeof a === "number" ? a : Number(a);
  const bNum = typeof b === "number" ? b : Number(b);
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;

  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

/**
 * Sorting for a table. `getValue` maps a row plus a column key to the value to
 * order by, which lets derived columns (utilization, interest) sort on their
 * underlying number rather than their formatted "15.0%" / "$22.68" text.
 *
 * With no column selected the original order is preserved untouched, so each
 * table keeps whatever default ordering its API returned.
 */
export function useSortable<T>(rows: T[], getValue: (row: T, key: string) => unknown) {
  const [sort, setSort] = useState<SortState>(NO_SORT);

  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const key = sort.key;
    const copy = [...rows];
    copy.sort((a, b) => {
      const aVal = getValue(a, key);
      const bVal = getValue(b, key);

      // Blanks settle at the bottom in both directions. A missing APR is not
      // "greater than" every real APR, so it should not lead a descending sort;
      // resolving blanks before applying direction keeps them out of the way.
      const aBlank = isBlank(aVal);
      const bBlank = isBlank(bVal);
      if (aBlank || bBlank) return aBlank && bBlank ? 0 : aBlank ? 1 : -1;

      const result = compareValues(aVal, bVal);
      return sort.dir === "asc" ? result : -result;
    });
    return copy;
  }, [rows, sort]);

  /** First click on a column sorts ascending; clicking the same column flips it. */
  function toggle(key: string) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  return { sorted, sort, toggle };
}
