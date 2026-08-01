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
 * The value type of a column's cells. This package is framework-agnostic so it
 * defaults to `string`;
 */
export type ColumnType =
  | "dateTime"
  | "date"
  | "time"
  | "number"
  | "string"
  | "boolean"
  | "decimal"
  | "currency"
  | "percent";

export type ColumnAlignment = "left" | "center" | "right";

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
  /**
   * Stable identity for state keyed by this column. Defaults to `field`, which
   * is unique in the common case but need not be — two columns may render the
   * same field differently.
   */
  id?: string;
  /** Header content, or a function returning it at render time. */
  header?: Header | (() => Header) | undefined;
  /**
   * The value type of this column's cells. This package is framework-agnostic so it
   * defaults to `string`;
   */
  type?: ColumnType;
  /**
   * Alignment of this column's cells. This package is framework-agnostic so it
   * defaults to `left` (`right` for numbers);
   */
  alignment?: ColumnAlignment;
  /**
   * Width in px this column starts at. A user resize overrides it for as long
   * as that resize lives in the sizing state.
   */
  width?: number;
  /** Lower bound a resize may not drag below. */
  minWidth?: number;
  /** Upper bound a resize may not drag above. */
  maxWidth?: number;
  /** Whether this column can be resized, overriding the grid-level default. */
  resizable?: boolean;
}

/**
 * Widths the user has changed, keyed by column id. Holding only what changed —
 * rather than every width — means a `width` edited in the column definition
 * still takes effect, and resetting is discarding the state.
 */
export type ColumnSizingState = Readonly<Record<string, number>>;

/** Sizes used for a column that does not specify its own. */
export interface ColumnSizeDefaults {
  width: number;
  minWidth: number;
  maxWidth: number;
}

/** The bounds a column's width is held between, resolved once from both. */
export interface ColumnConstraints {
  minWidth: number;
  maxWidth: number;
}

/** A column paired with the width it renders at. */
export interface ResolvedColumn<Row, Header = string> {
  column: ColumnDefinition<Row, Header>;
  id: string;
  width: number;
  /**
   * Whether `width` came from the sizing state rather than the column
   * definition — that is, whether the user set it. Auto-fit leaves these
   * columns alone so that resizing one does not undo itself.
   */
  sized: boolean;
}

/**
 * A resize in progress. It captures its constraints up front so that applying
 * a pointer position is arithmetic on numbers alone — no column, no DOM.
 */
export interface ColumnResizeSession {
  readonly columnId: string;
  readonly startWidth: number;
  readonly startPosition: number;
  readonly constraints: ColumnConstraints;
}

/**
 * Reports a user resize. `phase` separates the two audiences: `"move"` fires
 * continuously for live feedback, `"end"` once on release — the one to persist.
 */
export interface ColumnResizeEvent {
  readonly columnId: string;
  readonly width: number;
  readonly sizing: ColumnSizingState;
  readonly phase: "move" | "end";
}
