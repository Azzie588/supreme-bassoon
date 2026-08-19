import { useState } from "preact/hooks";

/** Tiny controlled-form helper: a string-keyed bag of string values, since HTML inputs
 * always deal in strings — numeric/date coercion happens where the payload is built. */
export function useForm(initial: Record<string, string> = {}) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const set = (key: string) => (e: Event) => {
    const target = e.currentTarget as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    setValues((v) => ({ ...v, [key]: target.value }));
  };
  const reset = (next: Record<string, string> = {}) => setValues(next);
  return { values, set, setValues, reset };
}

export function toNumOrNull(s: string | undefined): number | null {
  if (s === undefined || s === "") return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

export function toIntOrNull(s: string | undefined): number | null {
  if (s === undefined || s === "") return null;
  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}
