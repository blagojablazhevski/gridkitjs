import type { ColumnDefinition, ColumnType } from "../types";

/**
 * Narrows to a value worth drilling into. Mirrors the `LeafValue` union in
 * `../types`: arrays and `Date`s are cell values rather than groups of
 * columns, and `null` cannot be introspected. Keep the two in sync.
 */
function isNested(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

function getType(value: unknown): ColumnType {
  if (value instanceof Date) return "dateTime";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "bigint") return "number";
  if (typeof value === "symbol") return "string";
  return "string";
}

/**
 * Derives one column per field across `rows`, in the order each field is first
 * seen — so a key that only appears in a later row still gets a column,
 * appended at the end. Nested objects contribute their non-object properties
 * as `"Parent.Child"`; anything deeper is skipped, as is the nested object
 * itself.
 *
 * Order follows `Object.entries`, which lists integer-like keys first
 * regardless of the order they were written in.
 */
export function defineColumnsFromRows<Row>(
  rows: readonly Row[],
): readonly ColumnDefinition<Row>[] {
  const columns: ColumnDefinition<Row>[] = [];
  const seen = new Set<string>();

  function add(field: string, value: unknown): void {
    if (seen.has(field)) {
      return;
    }
    seen.add(field);
    columns.push({ field, type: getType(value) });
  }

  for (const row of rows) {
    if (!isNested(row)) {
      continue;
    }
    for (const [key, value] of Object.entries(row)) {
      if (!isNested(value)) {
        add(key, value);
        continue;
      }
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (!isNested(nestedValue)) {
          add(`${key}.${nestedKey}`, nestedValue);
        }
      }
    }
  }

  return columns;
}

/**
 * Accesses a value at a dotted path, e.g. `foo.bar.baz`.
 *
 * @param obj The object to access
 * @param path Path to the value, e.g. `"foo.bar"`
 * @returns The value at `path`, or `undefined` if it doesn't exist
 */
export function accessDotted(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce((value, key) => (isNested(value) ? value[key] : undefined), obj);
}
