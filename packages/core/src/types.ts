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
  /** This row's id, as `resolveRowId` settled it. */
  rowId: string;
  /** Whether this row is selected, so a template can style itself to match. */
  selected: boolean;
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
  /**
   * Whether this column can be dragged to a new position, overriding the
   * grid-level default. A column that cannot move can still be moved past.
   */
  reorderable?: boolean;
  /**
   * Lets this column's header and/or cell text wrap onto multiple lines
   * instead of the grid's default single line with an ellipsis. Off by
   * default: wrapping changes row height, so it stays a column's own choice
   * rather than something a minor release could turn on under an existing
   * grid.
   */
  wrap?: ColumnWrapConfig;
  /**
   * Extra class names appended to this column's `th`. An escape hatch for a
   * consumer's own CSS — nothing in this package reads them — for anything
   * `wrap` and the rest of this type don't cover.
   */
  headerClassName?: string;
  /**
   * Extra class names appended to this column's `td`, on every row. Static
   * per column: a per-row condition is already `cellTemplate`'s job (a
   * template returning its own markup with a conditional class), so this
   * stays a plain string rather than taking the row.
   */
  cellClassName?: string;
}

/** Which parts of a column opt out of the grid's default single-line text. */
export interface ColumnWrapConfig {
  header?: boolean;
  cells?: boolean;
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
  /** Whether columns are reorderable, unless a column says otherwise. */
  reorderable?: boolean | undefined;
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
  /** Whether this column can be dragged, after the grid-level default. */
  reorderable: boolean;
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

/**
 * Column ids in the order they render. It need not list every column: one
 * absent from it keeps its position among the definitions and follows those
 * that are listed.
 */
export type ColumnOrderState = readonly string[];

/**
 * Which side of a column a drop lands on, normalised away by
 * `resolveDropBefore` so it reaches no state.
 */
export type DropSide = "before" | "after";

/**
 * Reports a user reorder. Unlike a resize there is no `"move"` phase — the
 * order does not change until the drop.
 */
export interface ColumnOrderEvent {
  readonly columnId: string;
  readonly order: ColumnOrderState;
}

/**
 * Ids selected, in the order they were selected — so the most recent is last,
 * and a consumer wanting only that reads `at(-1)` rather than tracking it
 * alongside.
 *
 * Ordered rather than a keyed record for that reason alone; a render layer
 * that needs lookups builds a `Set` from it. Rows and columns share the type:
 * they are both a list of ids, and the state they live in already names which.
 */
export type SelectionState = readonly string[];

/**
 * How much of a member may be selected at once. `false` rather than an absent
 * key so that turning selection off for one member reads the same as never
 * having enabled it.
 */
export type SelectionMode = false | "single" | "multiple";

/**
 * The modes a cell may take. A cell addresses one value, so it has no
 * `"multiple"` — a range of cells is a different feature, with a rectangle
 * rather than a list behind it.
 */
export type CellSelectionMode = false | "single";

/**
 * Which parts of the grid the user may select, and how many of each.
 *
 * Off by default, unlike `HoverableConfig`: selection claims the click, which
 * a grid that only displays data should not do.
 */
export interface SelectableConfig {
  rows?: SelectionMode | undefined;
  columns?: SelectionMode | undefined;
  cells?: CellSelectionMode | undefined;
}

/** The address of one cell: which row, and which column within it. */
export interface SelectedCellRef {
  readonly rowId: string;
  readonly columnId: string;
}

/** The one selected cell, or `null` for none. */
export type CellSelectionState = SelectedCellRef | null;

/**
 * What changed between two selections. Ids rather than resolved members, so
 * that the transform producing it stays free of the data it selects from.
 */
export interface SelectionDiff {
  readonly added: readonly string[];
  readonly removed: readonly string[];
}

/**
 * A row paired with the identity and position it renders under — the row
 * counterpart to `ResolvedColumn`, and resolved once for the same reason: so
 * no part of the grid works out a row's id for itself.
 *
 * It is also what the selection callbacks report, so a handler reads the row
 * itself rather than an id it has to look up.
 */
export interface ResolvedRow<Row> {
  readonly rowId: string;
  readonly row: Row;
  /** Position among the rows as rendered, matching `CellTemplateContext`. */
  readonly rowIndex: number;
}

/**
 * A selected column. Carries the resolved column rather than the bare
 * definition, so a handler reads the width and label the user actually
 * clicked rather than what the definition asked for.
 */
export interface SelectedColumn<Row, Node = string> {
  readonly columnId: string;
  readonly column: ResolvedColumn<Row, Node>;
  /** Position among the columns as displayed, so after any reorder. */
  readonly columnIndex: number;
}

/** A selected cell, resolved down to the value it shows. */
export interface SelectedCell<Row, Node = string> {
  readonly rowId: string;
  readonly columnId: string;
  readonly row: Row;
  readonly column: ResolvedColumn<Row, Node>;
  readonly rowIndex: number;
  readonly columnIndex: number;
  /** Read off the column's field path — the value a `cellTemplate` receives. */
  readonly value: unknown;
}

/** Reports one row selected or deselected. */
export interface RowSelectEvent<Row> {
  readonly row: ResolvedRow<Row>;
  readonly selection: SelectionState;
}

/**
 * Reports every row one interaction selected or deselected. Fires once for a
 * range that `RowSelectEvent` reports one row at a time.
 */
export interface RowsSelectEvent<Row> {
  readonly rows: readonly ResolvedRow<Row>[];
  readonly selection: SelectionState;
}

/**
 * Reports a row selection change whole: what it gained, what it lost, and
 * everything it now holds. The one to persist from.
 */
export interface RowSelectionChangeEvent<Row> {
  readonly added: readonly ResolvedRow<Row>[];
  readonly removed: readonly ResolvedRow<Row>[];
  /** Every selected row, not only what this interaction changed. */
  readonly selected: readonly ResolvedRow<Row>[];
  readonly selection: SelectionState;
}

/** Reports one column selected or deselected. */
export interface ColumnSelectEvent<Row, Node = string> {
  readonly column: SelectedColumn<Row, Node>;
  readonly selection: SelectionState;
}

/** Reports every column one interaction selected or deselected. */
export interface ColumnsSelectEvent<Row, Node = string> {
  readonly columns: readonly SelectedColumn<Row, Node>[];
  readonly selection: SelectionState;
}

/** Reports a column selection change whole. The one to persist from. */
export interface ColumnSelectionChangeEvent<Row, Node = string> {
  readonly added: readonly SelectedColumn<Row, Node>[];
  readonly removed: readonly SelectedColumn<Row, Node>[];
  /** Every selected column, not only what this interaction changed. */
  readonly selected: readonly SelectedColumn<Row, Node>[];
  readonly selection: SelectionState;
}

/** Reports the cell selected or deselected. */
export interface CellSelectEvent<Row, Node = string> {
  readonly cell: SelectedCell<Row, Node>;
  readonly selection: CellSelectionState;
}

/**
 * Reports a cell selection change whole. Both fields are nullable and one
 * interaction can fill both — moving between cells deselects and selects at
 * once.
 */
export interface CellSelectionChangeEvent<Row, Node = string> {
  readonly selected: SelectedCell<Row, Node> | null;
  readonly deselected: SelectedCell<Row, Node> | null;
  readonly selection: CellSelectionState;
}
