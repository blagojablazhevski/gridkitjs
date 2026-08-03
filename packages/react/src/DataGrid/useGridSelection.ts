import { useMemo, useRef, type Dispatch, type SetStateAction } from "react";
import {
  accessDotted,
  clearSelection,
  diffSelection,
  selectAll,
  selectCell,
  selectOnly,
  selectRange,
  toggleCellSelection,
  toggleSelection,
  type CellSelectionMode,
  type CellSelectionState,
  type ResolvedRow,
  type SelectableConfig,
  type SelectedCellRef,
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
  SelectedCell,
  SelectedColumn,
} from "./DataGrid";

/**
 * What an interaction means for the selection, read off its modifiers once at
 * the boundary so that nothing downstream handles a raw event.
 */
export type SelectIntent = "replace" | "toggle" | "range";

/** The intent a click or key press carries, by the modifiers held with it. */
export function intentOf(event: {
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}): SelectIntent {
  if (event.shiftKey) {
    return "range";
  }
  // Cmd on a Mac is Ctrl everywhere else, and both mean the same thing here.
  return event.ctrlKey || event.metaKey ? "toggle" : "replace";
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

/**
 * The transform an intent asks for. A function rather than a branch inside
 * each caller, so a row and a column cannot come to mean different things by
 * the same click.
 */
function applyIntent(
  selection: SelectionState,
  orderedIds: readonly string[],
  anchorId: string | null,
  id: string,
  intent: SelectIntent,
  mode: SelectionMode,
): SelectionState {
  switch (intent) {
    case "toggle":
      return toggleSelection(selection, id, mode);
    // A range with no anchor yet spans from the id to itself, which is the
    // plain click a first Shift-click may as well be.
    case "range":
      return selectRange(selection, orderedIds, anchorId ?? id, id, mode);
    default:
      return selectOnly(selection, id, mode);
  }
}

function countMessage(count: number, noun: string): string {
  if (count === 0) {
    return `No ${noun}s selected`;
  }
  return count === 1
    ? `1 ${noun} selected`
    : `${String(count)} ${noun}s selected`;
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

  const rowsById = useMemo(
    () => new Map(rows.map((entry) => [entry.rowId, entry])),
    [rows],
  );
  const rowIds = useMemo(() => rows.map((entry) => entry.rowId), [rows]);
  const columnIds = useMemo(() => columns.map((entry) => entry.id), [columns]);

  const selectedRowIds = useMemo(() => new Set(rowSelection), [rowSelection]);
  const selectedColumnIds = useMemo(
    () => new Set(columnSelection),
    [columnSelection],
  );

  /**
   * Where a range is measured from: the last row or column selected by
   * anything but a range, so that repeated Shift-clicks re-draw one span
   * instead of walking the anchor along with them.
   */
  const rowAnchor = useRef<string | null>(null);
  const columnAnchor = useRef<string | null>(null);

  /**
   * Ids with no row behind them are dropped rather than reported: a selection
   * outlives a change to the data, so that filtering a row out and back leaves
   * it selected, and only what is on screen can be handed to a callback.
   */
  function resolveRows(ids: readonly string[]): readonly ResolvedRow<Row>[] {
    return ids.map((id) => rowsById.get(id)).filter((row) => row !== undefined);
  }

  function resolveColumns(
    ids: readonly string[],
  ): readonly SelectedColumn<Row>[] {
    return ids
      .map((id) => {
        const columnIndex = columns.findIndex((entry) => entry.id === id);
        const column = columns[columnIndex];
        return column === undefined
          ? undefined
          : { columnId: id, column, columnIndex };
      })
      .filter((column) => column !== undefined);
  }

  function resolveCell(ref: CellSelectionState): SelectedCell<Row> | null {
    if (ref === null) {
      return null;
    }
    const entry = rowsById.get(ref.rowId);
    const columnIndex = columns.findIndex(
      (candidate) => candidate.id === ref.columnId,
    );
    const column = columns[columnIndex];
    if (entry === undefined || column === undefined) {
      return null;
    }
    return {
      rowId: ref.rowId,
      columnId: ref.columnId,
      row: entry.row,
      column,
      rowIndex: entry.rowIndex,
      columnIndex,
      value: accessDotted(entry.row, column.column.field),
    };
  }

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
    if (next === rowSelection) {
      return;
    }
    setRowSelection(next);

    const { added, removed } = diffSelection(rowSelection, next);
    const addedRows = resolveRows(added);
    const removedRows = resolveRows(removed);

    for (const row of addedRows) {
      callbacks.onRowSelect?.({ row, selection: next });
    }
    if (addedRows.length > 0) {
      callbacks.onRowsSelect?.({ rows: addedRows, selection: next });
    }
    for (const row of removedRows) {
      callbacks.onRowDeselect?.({ row, selection: next });
    }
    if (removedRows.length > 0) {
      callbacks.onRowsDeselect?.({ rows: removedRows, selection: next });
    }
    callbacks.onRowSelectionChange?.({
      added: addedRows,
      removed: removedRows,
      selected: resolveRows(next),
      selection: next,
    });
    announceCount(added.length + removed.length, next.length, "row");
  }

  function commitColumns(next: SelectionState): void {
    if (next === columnSelection) {
      return;
    }
    setColumnSelection(next);

    const { added, removed } = diffSelection(columnSelection, next);
    const addedColumns = resolveColumns(added);
    const removedColumns = resolveColumns(removed);

    for (const column of addedColumns) {
      callbacks.onColumnSelect?.({ column, selection: next });
    }
    if (addedColumns.length > 0) {
      callbacks.onColumnsSelect?.({ columns: addedColumns, selection: next });
    }
    for (const column of removedColumns) {
      callbacks.onColumnDeselect?.({ column, selection: next });
    }
    if (removedColumns.length > 0) {
      callbacks.onColumnsDeselect?.({
        columns: removedColumns,
        selection: next,
      });
    }
    callbacks.onColumnSelectionChange?.({
      added: addedColumns,
      removed: removedColumns,
      selected: resolveColumns(next),
      selection: next,
    });
    announceCount(added.length + removed.length, next.length, "column");
  }

  function commitCell(next: CellSelectionState): void {
    if (next === cellSelection) {
      return;
    }
    setCellSelection(next);

    // Resolved before and after in one place, so that moving between two cells
    // reports the leaving and the arriving as one change.
    const selected = resolveCell(next);
    const deselected = resolveCell(cellSelection);

    if (deselected !== null) {
      callbacks.onCellDeselect?.({ cell: deselected, selection: next });
    }
    if (selected !== null) {
      callbacks.onCellSelect?.({ cell: selected, selection: next });
    }
    callbacks.onCellSelectionChange?.({
      selected,
      deselected,
      selection: next,
    });
  }

  function selectRow(rowId: string, intent: SelectIntent): void {
    const next = applyIntent(
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
    const next = applyIntent(
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
