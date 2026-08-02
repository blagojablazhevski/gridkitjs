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
 * What `cellTemplate` receives. An object rather than positional arguments so
 * that a later addition — a sort state, whether the row is selected — is not a
 * breaking change to every template already written.
 */
export interface CellTemplateContext<Row> {
  /**
   * This cell's value, read off the column's field path. `unknown` because a
   * dotted path's type cannot be recovered here; a template narrows it.
   */
  value: unknown;
  /** The whole row, for a template that needs a sibling field. */
  row: Row;
  /**
   * Position among the rows as rendered. Once paging exists this is the index
   * within the page; an index into the whole dataset would be a second field.
   */
  rowIndex: number;
}

/**
 * @typeParam Node - What a header or cell renders to. This package is
 * framework-agnostic so it defaults to `string`; `@gridkitjs/react` binds it to
 * `ReactNode` so a template can return JSX.
 */
export interface ColumnDefinition<Row, Node = string> {
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
  headerTemplate?: Node | (() => Node) | undefined;
  /**
   * Renders this column's cells in place of the raw value at `field`. The
   * value is still resolved and handed over, so a template that only formats
   * it never repeats the field path.
   */
  cellTemplate?: ((context: CellTemplateContext<Row>) => Node) | undefined;
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

/**
 * Grid-level defaults a column falls back to when it does not set its own.
 * Sizes are grouped so the rest of the grid's defaults have somewhere to go.
 */
export interface ColumnResolveOptions {
  sizes?: Partial<ColumnSizeDefaults> | undefined;
  /** Whether columns are resizable, unless a column says otherwise. */
  resizable?: boolean | undefined;
}

/**
 * A column paired with everything it takes to render it. Each field is a
 * decision made once here rather than in each adapter, so a second framework
 * binding renders identically without repeating the logic.
 */
export interface ResolvedColumn<Row, Node = string> {
  column: ColumnDefinition<Row, Node>;
  id: string;
  width: number;
  /**
   * Whether `width` came from the sizing state rather than the column
   * definition — that is, whether the user set it. Auto-fit leaves these
   * columns alone so that resizing one does not undo itself.
   */
  sized: boolean;
  /**
   * What the header shows: the column's own `headerTemplate`, or a label read
   * off the field path. `string` is in the union because that fallback is text
   * whatever `Node` is bound to.
   */
  label: Node | string;
  /** Whether this column can be resized, after the grid-level default. */
  resizable: boolean;
  /** How this column's cells align, after falling back to its type. */
  alignment: ColumnAlignment;
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
