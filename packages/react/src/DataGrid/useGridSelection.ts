import {
  useMemo,
  useRef,
  type Dispatch,
  type KeyboardEvent as ReactKeyboardEvent,
  type SetStateAction,
} from "react";
import {
  applySelectionIntent,
  clearSelection,
  diffSelection,
  resolveCell,
  resolveColumns,
  resolveRows,
  selectAll,
  selectCell,
  toggleCellSelection,
  type CellSelectionMode,
  type CellSelectionState,
  type ResolvedRow,
  type SelectableConfig,
  type SelectedCellRef,
  type SelectIntent,
  type SelectionMode,
  type SelectionState,
  type RowSelectEvent,
  type RowSelectionChangeEvent,
  type RowsSelectEvent,
} from "@gridkitjs/core";
import type {
  CellSelectEvent,
  CellSelectionChangeEvent,
  ColumnSelectEvent,
  ColumnSelectionChangeEvent,
  ColumnsSelectEvent,
  ResolvedColumn,
} from "./DataGrid";
import { commitIfChanged } from "./commitIfChanged";

/**
 * The modifiers a Space or Enter keydown carries, for a caller that means to
 * hand them to `intentOf` as a click's modifiers would be. Space builds a
 * selection up and Enter replaces it, as in the body — so Space is mapped to
 * act like Ctrl, matching Ctrl-click and the plain click they stand in for.
 */
export function keyboardSelectIntent(event: ReactKeyboardEvent): {
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
} {
  return {
    ctrlKey: event.key === " " || event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
  };
}

/**
 * Reported as the user selects. Every one of these is fanned out from a single
 * diff of the transition it describes, so no two can disagree about what one
 * interaction did.
 */
export interface SelectionCallbacks<Row> {
  /** Called once per row newly selected. The last call names the last row. */
  onRowSelect?: ((event: RowSelectEvent<Row>) => void) | undefined;
  /** Called once with every row one interaction selected. */
  onRowsSelect?: ((event: RowsSelectEvent<Row>) => void) | undefined;
  onRowDeselect?: ((event: RowSelectEvent<Row>) => void) | undefined;
  onRowsDeselect?: ((event: RowsSelectEvent<Row>) => void) | undefined;
  /**
   * Called once per change with what it added, what it removed and everything
   * selected after it — the one to persist from.
   */
  onRowSelectionChange?:
    ((event: RowSelectionChangeEvent<Row>) => void) | undefined;
  onColumnSelect?: ((event: ColumnSelectEvent<Row>) => void) | undefined;
  onColumnsSelect?: ((event: ColumnsSelectEvent<Row>) => void) | undefined;
  onColumnDeselect?: ((event: ColumnSelectEvent<Row>) => void) | undefined;
  onColumnsDeselect?: ((event: ColumnsSelectEvent<Row>) => void) | undefined;
  onColumnSelectionChange?:
    ((event: ColumnSelectionChangeEvent<Row>) => void) | undefined;
  onCellSelect?: ((event: CellSelectEvent<Row>) => void) | undefined;
  onCellDeselect?: ((event: CellSelectEvent<Row>) => void) | undefined;
  onCellSelectionChange?:
    ((event: CellSelectionChangeEvent<Row>) => void) | undefined;
}

interface UseGridSelectionOptions<Row> {
  rows: readonly ResolvedRow<Row>[];
  columns: readonly ResolvedColumn<Row>[];
  selectable: SelectableConfig | undefined;
  rowSelection: SelectionState;
  setRowSelection: Dispatch<SetStateAction<SelectionState>>;
  columnSelection: SelectionState;
  setColumnSelection: Dispatch<SetStateAction<SelectionState>>;
  cellSelection: CellSelectionState;
  setCellSelection: Dispatch<SetStateAction<CellSelectionState>>;
  callbacks: SelectionCallbacks<Row>;
  announce: (message: string) => void;
}

export interface GridSelectionApi {
  rowMode: SelectionMode;
  columnMode: SelectionMode;
  cellMode: CellSelectionMode;
  /**
   * Lookups for the render pass. The state itself stays an ordered list, which
   * is what makes the most recent selection its last entry.
   */
  selectedRowIds: ReadonlySet<string>;
  selectedColumnIds: ReadonlySet<string>;
  selectedCell: CellSelectionState;
  selectRow: (rowId: string, intent: SelectIntent) => void;
  selectColumn: (columnId: string, intent: SelectIntent) => void;
  selectCell: (cell: SelectedCellRef, intent: SelectIntent) => void;
  selectAllRows: () => void;
  /** Lets go of every selection at once, as Escape does. */
  clear: () => void;
}

function countMessage(count: number, noun: string): string {
  if (count === 0) {
    return `No ${noun}s selected`;
  }
  return count === 1
    ? `1 ${noun} selected`
    : `${String(count)} ${noun}s selected`;
}

/** A `Set` re-derived only when `values` changes. */
function useAsSet<T>(values: readonly T[]): ReadonlySet<T> {
  return useMemo(() => new Set(values), [values]);
}

/**
 * A `Map` keying `values` by their `key` property, re-derived only when
 * `values` changes. Takes the key as a property name rather than an
 * extractor function so that it stays a stable dependency across
 * renders — an inline extractor handed in fresh each render would otherwise
 * force a recompute on every render regardless of whether `values` changed.
 */
function useIndexedBy<T, K extends keyof T>(
  values: readonly T[],
  key: K,
): ReadonlyMap<T[K], T> {
  return useMemo(
    () => new Map(values.map((value) => [value[key], value])),
    [values, key],
  );
}

/** `values.map((value) => value[key])`, re-derived only when `values` changes. */
function useMappedArray<T, K extends keyof T>(
  values: readonly T[],
  key: K,
): readonly T[K][] {
  return useMemo(() => values.map((value) => value[key]), [values, key]);
}

/**
 * Turns an intent against a row, column or cell into the selection it implies,
 * and reports what changed.
 *
 * Holds no state of its own: the three selections live in `DataGrid` beside
 * the sizing and the order, so that a ref exposing them later, or a feature
 * reading them, finds them in one place.
 */
export default function useGridSelection<Row>({
  rows,
  columns,
  selectable,
  rowSelection,
  setRowSelection,
  columnSelection,
  setColumnSelection,
  cellSelection,
  setCellSelection,
  callbacks,
  announce,
}: UseGridSelectionOptions<Row>): GridSelectionApi {
  const rowMode = selectable?.rows ?? false;
  const columnMode = selectable?.columns ?? false;
  const cellMode = selectable?.cells ?? false;

  const rowsById = useIndexedBy(rows, "rowId");
  const rowIds = useMappedArray(rows, "rowId");
  const columnIds = useMappedArray(columns, "id");

  const selectedRowIds = useAsSet(rowSelection);
  const selectedColumnIds = useAsSet(columnSelection);

  /**
   * Where a range is measured from: the last row or column selected by
   * anything but a range, so that repeated Shift-clicks re-draw one span
   * instead of walking the anchor along with them.
   */
  const rowAnchor = useRef<string | null>(null);
  const columnAnchor = useRef<string | null>(null);

  /**
   * Announced only for a change touching more than one member. A single
   * selection is already carried by the focused row's own `aria-selected`, and
   * repeating it here would talk over that.
   */
  function announceCount(changed: number, total: number, noun: string): void {
    if (changed > 1) {
      announce(countMessage(total, noun));
    }
  }

  function commitRows(next: SelectionState): void {
    // The unchanged-reference contract the core transforms keep: a click that
    // selects what was already selected neither renders nor reports.
    commitIfChanged(rowSelection, next, setRowSelection, (committed) => {
      const { added, removed } = diffSelection(rowSelection, committed);
      const addedRows = resolveRows(rowsById, added);
      const removedRows = resolveRows(rowsById, removed);

      for (const row of addedRows) {
        callbacks.onRowSelect?.({ row, selection: committed });
      }
      if (addedRows.length > 0) {
        callbacks.onRowsSelect?.({ rows: addedRows, selection: committed });
      }
      for (const row of removedRows) {
        callbacks.onRowDeselect?.({ row, selection: committed });
      }
      if (removedRows.length > 0) {
        callbacks.onRowsDeselect?.({ rows: removedRows, selection: committed });
      }
      callbacks.onRowSelectionChange?.({
        added: addedRows,
        removed: removedRows,
        selected: resolveRows(rowsById, committed),
        selection: committed,
      });
      announceCount(added.length + removed.length, committed.length, "row");
    });
  }

  function commitColumns(next: SelectionState): void {
    commitIfChanged(columnSelection, next, setColumnSelection, (committed) => {
      const { added, removed } = diffSelection(columnSelection, committed);
      const addedColumns = resolveColumns(columns, added);
      const removedColumns = resolveColumns(columns, removed);

      for (const column of addedColumns) {
        callbacks.onColumnSelect?.({ column, selection: committed });
      }
      if (addedColumns.length > 0) {
        callbacks.onColumnsSelect?.({
          columns: addedColumns,
          selection: committed,
        });
      }
      for (const column of removedColumns) {
        callbacks.onColumnDeselect?.({ column, selection: committed });
      }
      if (removedColumns.length > 0) {
        callbacks.onColumnsDeselect?.({
          columns: removedColumns,
          selection: committed,
        });
      }
      callbacks.onColumnSelectionChange?.({
        added: addedColumns,
        removed: removedColumns,
        selected: resolveColumns(columns, committed),
        selection: committed,
      });
      announceCount(added.length + removed.length, committed.length, "column");
    });
  }

  function commitCell(next: CellSelectionState): void {
    commitIfChanged(cellSelection, next, setCellSelection, (committed) => {
      // Resolved before and after in one place, so that moving between two
      // cells reports the leaving and the arriving as one change.
      const selected = resolveCell(rowsById, columns, committed);
      const deselected = resolveCell(rowsById, columns, cellSelection);

      if (deselected !== null) {
        callbacks.onCellDeselect?.({ cell: deselected, selection: committed });
      }
      if (selected !== null) {
        callbacks.onCellSelect?.({ cell: selected, selection: committed });
      }
      callbacks.onCellSelectionChange?.({
        selected,
        deselected,
        selection: committed,
      });
    });
  }

  function selectRow(rowId: string, intent: SelectIntent): void {
    const next = applySelectionIntent(
      rowSelection,
      rowIds,
      rowAnchor.current,
      rowId,
      intent,
      rowMode,
    );
    if (intent !== "range") {
      rowAnchor.current = rowId;
    }
    commitRows(next);
  }

  function selectColumn(columnId: string, intent: SelectIntent): void {
    const next = applySelectionIntent(
      columnSelection,
      columnIds,
      columnAnchor.current,
      columnId,
      intent,
      columnMode,
    );
    if (intent !== "range") {
      columnAnchor.current = columnId;
    }
    commitColumns(next);
  }

  function selectCellAt(cell: SelectedCellRef, intent: SelectIntent): void {
    // A cell holds one value, so a range over cells has nothing to span and
    // reads as the plain click it looks like.
    commitCell(
      intent === "toggle"
        ? toggleCellSelection(cellSelection, cell, cellMode)
        : selectCell(cellSelection, cell, cellMode),
    );
  }

  function selectAllRows(): void {
    commitRows(selectAll(rowSelection, rowIds, rowMode));
  }

  function clear(): void {
    commitRows(clearSelection(rowSelection));
    commitColumns(clearSelection(columnSelection));
    commitCell(null);
  }

  // A new object each render, as the other hooks here return: the handlers
  // close over the selections they transform.
  return {
    rowMode,
    columnMode,
    cellMode,
    selectedRowIds,
    selectedColumnIds,
    selectedCell: cellSelection,
    selectRow,
    selectColumn,
    selectCell: selectCellAt,
    selectAllRows,
    clear,
  };
}
