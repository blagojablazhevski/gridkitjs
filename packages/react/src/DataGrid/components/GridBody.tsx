import type { ResolvedRow } from "@gridkitjs/core";
import type { ResolvedColumn } from "../DataGrid";
import type { GridNavigationApi } from "../useGridNavigation";
import { intentOf, type GridSelectionApi } from "../useGridSelection";
import GridRow from "./GridRow";

interface GridBodyProps<Row> {
  columns: readonly ResolvedColumn<Row>[];
  rows: readonly ResolvedRow<Row>[];
  /** The column being resized, so its cells outline with its header. */
  activeColumnId: string | null;
  nav: GridNavigationApi;
  selection: GridSelectionApi;
}

/** Where a cell sits, read off the table's own indices rather than an attribute. */
interface CellPosition {
  rowIndex: number;
  columnIndex: number;
  columnId: string;
}

/**
 * The cell an event happened in. `closest` is what makes the whole cell the
 * target: a click on a template's own markup resolves to the cell holding it.
 */
function cellFrom(target: EventTarget): CellPosition | null {
  if (!(target instanceof Element)) {
    return null;
  }
  const cell = target.closest("td[data-gridkit-column]");
  const row = cell?.parentElement;
  const columnId = cell?.getAttribute("data-gridkit-column");
  if (
    !(cell instanceof HTMLTableCellElement) ||
    !(row instanceof HTMLTableRowElement) ||
    columnId === null ||
    columnId === undefined
  ) {
    return null;
  }
  return {
    rowIndex: row.sectionRowIndex,
    columnIndex: cell.cellIndex,
    columnId,
  };
}

/**
 * Events are delegated to the body rather than bound per cell, which is what
 * lets `GridRow` be memoised: a handler rebuilt each render is a prop that
 * changes each render, and one reaching every row would defeat the boundary
 * entirely.
 */
export default function GridBody<Row>({
  columns,
  rows,
  activeColumnId,
  nav,
  selection,
}: GridBodyProps<Row>) {
  const { selectedCell, rowMode, cellMode } = selection;

  /** The row and cell an event addresses, resolved once for every handler. */
  function targetOf(
    target: EventTarget,
  ): { position: CellPosition; rowId: string } | null {
    const position = cellFrom(target);
    const entry = position === null ? undefined : rows[position.rowIndex];
    return position === null || entry === undefined
      ? null
      : { position, rowId: entry.rowId };
  }

  function select(
    rowId: string,
    columnId: string,
    modifiers: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean },
  ): void {
    const intent = intentOf(modifiers);
    // Independent of each other: selecting a cell says nothing about its row,
    // so a grid with both on reports both.
    if (rowMode !== false) {
      selection.selectRow(rowId, intent);
    }
    if (cellMode !== false) {
      selection.selectCell({ rowId, columnId }, intent);
    }
  }

  return (
    <tbody
      className="grid-body"
      onFocus={(event) => {
        const found = targetOf(event.target);
        if (found === null) return;
        nav.focusCell(found.position.rowIndex, found.position.columnIndex);
      }}
      onClick={(event) => {
        const found = targetOf(event.target);
        if (found === null) return;
        select(found.rowId, found.position.columnId, event);
      }}
      onKeyDown={(event) => {
        // Space builds a selection up and Enter replaces it, matching the
        // Ctrl-click and the plain click they stand in for.
        if (event.key === " " || event.key === "Enter") {
          const found = targetOf(event.target);
          if (found === null) return;
          // Taken whether or not anything is selectable: Space would otherwise
          // scroll the grid out from under the focused cell.
          event.preventDefault();
          select(found.rowId, found.position.columnId, {
            ctrlKey: event.key === " " || event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey,
          });
          return;
        }
        nav.onKeyDown(event);
      }}
    >
      {rows.map(({ rowId, row, rowIndex }) => (
        <GridRow<Row>
          key={rowId}
          columns={columns}
          rowId={rowId}
          row={row}
          rowIndex={rowIndex}
          activeColumnId={activeColumnId}
          selectedColumnIds={selection.selectedColumnIds}
          selected={selection.selectedRowIds.has(rowId)}
          /*
           * Narrowed to this row before it crosses the boundary, so that moving
           * the selected cell re-renders the two rows it moved between rather
           * than all of them.
           */
          selectedColumnId={
            selectedCell?.rowId === rowId ? selectedCell.columnId : null
          }
          focusedColumnIndex={
            nav.focus.rowIndex === rowIndex ? nav.focus.columnIndex : null
          }
          rowsSelectable={rowMode !== false}
          cellsSelectable={cellMode !== false}
        />
      ))}
    </tbody>
  );
}
