import type { JSX } from "preact";
import type { SortState } from "../sorting";

/**
 * A column header that sorts on click. The inner button exists so the control is
 * reachable and operable by keyboard; `aria-sort` reports current state to screen
 * readers rather than relying on the arrow glyph alone.
 */
export function SortableTh(props: {
  label: string;
  sortKey: string;
  sort: SortState;
  onSort: (key: string) => void;
}) {
  const active = props.sort.key === props.sortKey;
  return (
    <th aria-sort={active ? (props.sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        class={`th-sort ${active ? "active" : ""}`}
        onClick={() => props.onSort(props.sortKey)}
        title={`Sort by ${props.label}`}
      >
        {props.label}
        <span class="sort-arrow">{active ? (props.sort.dir === "asc" ? "▲" : "▼") : "↕"}</span>
      </button>
    </th>
  );
}

export function Card(props: { title?: string; children: JSX.Element | JSX.Element[] }) {
  return (
    <div class="card">
      {props.title && <h3>{props.title}</h3>}
      {props.children}
    </div>
  );
}

export function Stat(props: { label: string; value: string; tone?: "good" | "warn" | "bad" }) {
  return (
    <div class="stat">
      <div class="label">{props.label}</div>
      <div class={`value ${props.tone ?? ""}`}>{props.value}</div>
    </div>
  );
}

export function Tag(props: { tone: "good" | "warn" | "bad"; children: string }) {
  return <span class={`tag ${props.tone}`}>{props.children}</span>;
}

interface FieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: Event) => void;
  type?: string;
  required?: boolean;
  step?: string;
  options?: string[];
}

export function Field(props: FieldProps) {
  if (props.options) {
    return (
      <div class="field">
        <label for={props.name}>{props.label}</label>
        <select id={props.name} name={props.name} value={props.value} onChange={props.onChange}>
          <option value="">—</option>
          {props.options.map((o) => (
            <option value={o} key={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <div class="field">
      <label for={props.name}>{props.label}</label>
      <input
        id={props.name}
        name={props.name}
        type={props.type ?? "text"}
        step={props.step}
        required={props.required}
        value={props.value}
        onChange={props.onChange}
      />
    </div>
  );
}

export function TextAreaField(props: {
  label: string;
  name: string;
  value: string;
  onChange: (e: Event) => void;
}) {
  return (
    <div class="field">
      <label for={props.name}>{props.label}</label>
      <textarea id={props.name} name={props.name} value={props.value} onChange={props.onChange} />
    </div>
  );
}
