/**
 * Values a cell shows as-is instead of being drilled into. Arrays and `Date`s
 * are cell values rather than groups of columns, and `null` cannot be
 * introspected, so all three end a path.
 */
type LeafValue =
  | bigint
  | boolean
  | number
  | string
  | symbol
  | null
  | undefined
  | Date
  | readonly unknown[]
  | ((...args: never[]) => unknown);

/** Keys of `T` holding a leaf value — the only ones a path may end on. */
type LeafKey<T> = {
  [K in keyof T & string]: NonNullable<T[K]> extends LeafValue ? K : never;
}[keyof T & string];

/**
 * Every addressable field of `Row`, one level deep: `"Id"` for a flat field,
 * `"Application.Id"` for a leaf inside a nested object. A nested object
 * contributes only its leaf children, never itself and never anything deeper.
 */
export type FieldPath<Row> = {
  [K in keyof Row & string]: NonNullable<Row[K]> extends LeafValue
    ? K
    : `${K}.${LeafKey<NonNullable<Row[K]>>}`;
}[keyof Row & string];

/**
 * @typeParam Header - What a header renders to. This package is
 * framework-agnostic so it defaults to `string`; `@gridkit/react` binds it to
 * `ReactNode` so a header callback can return JSX.
 */
export interface ColumnDefinition<Row, Header = string> {
  /**
   * Path to this cell's value: a key of `Row`, or `"Parent.Child"` for a leaf
   * one level inside a nested object. Any string still compiles — the union
   * exists to drive autocomplete, not to lock the grid down.
   */
  field: FieldPath<Row> | (string & {});
  /** Header content, or a function returning it at render time. */
  header?: Header | (() => Header) | undefined;
}
