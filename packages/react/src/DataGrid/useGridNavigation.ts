import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";

/**
 * The header's row index. One coordinate space covers the header and the body
 * so that arrowing up out of the first row reaches the header without a case
 * of its own, and every other move is plain arithmetic.
 */
export const HEADER_ROW = -1;

/** Rows a page key moves when the viewport cannot be measured. */
const FALLBACK_PAGE = 10;

/** The cell the grid's single tab stop sits on. */
export interface GridFocus {
  readonly rowIndex: number;
  readonly columnIndex: number;
}

interface UseGridNavigationOptions {
  tableRef: RefObject<HTMLTableElement | null>;
  rowCount: number;
  columnCount: number;
}

export interface GridNavigationApi {
  focus: GridFocus;
  /**
   * `0` for the focused cell and `-1` for every other. A grid is one tab stop:
   * tabbing reaches it, and the arrow keys move within it.
   */
  tabIndexFor: (rowIndex: number, columnIndex: number) => 0 | -1;
  /** Moves the tab stop, and the browser's focus with it. */
  focusCell: (rowIndex: number, columnIndex: number) => void;
  /** Handles the navigation keys, leaving every other key to bubble. */
  onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
}

/**
 * Holds a coordinate inside the grid, so that a focus surviving a column
 * removal or a shorter page never leaves the grid with no tab stop at all —
 * which is a grid a keyboard cannot reach.
 */
function clampFocus(
  focus: GridFocus,
  rowCount: number,
  columnCount: number,
): GridFocus {
  return {
    rowIndex: Math.min(Math.max(focus.rowIndex, HEADER_ROW), rowCount - 1),
    columnIndex: Math.min(
      Math.max(focus.columnIndex, 0),
      Math.max(columnCount - 1, 0),
    ),
  };
}

/**
 * The cell at a coordinate, found through the table's own row and cell
 * collections rather than a selector.
 *
 * Ids can hold anything a consumer's data holds, and an attribute selector
 * built from one would have to escape it; positions need no quoting.
 */
function cellAt(table: HTMLTableElement, focus: GridFocus): HTMLElement | null {
  const row =
    focus.rowIndex === HEADER_ROW
      ? (table.tHead?.rows[0] ?? null)
      : (table.tBodies[0]?.rows[focus.rowIndex] ?? null);
  return row?.cells[focus.columnIndex] ?? null;
}

/**
 * Moves one tab stop around the grid, which is what `role="grid"` obliges:
 * arrow keys travel cell to cell and Tab passes the whole grid by.
 *
 * Separate from selection because focus and selection are different states — a
 * cell is focused while travelling before anything is selected, and every cell
 * of a range is selected without being focused. Navigation also has to work
 * with selection turned off entirely, so it cannot depend on it.
 */
export default function useGridNavigation({
  tableRef,
  rowCount,
  columnCount,
}: UseGridNavigationOptions): GridNavigationApi {
  const [stored, setStored] = useState<GridFocus>({
    rowIndex: HEADER_ROW,
    columnIndex: 0,
  });

  /**
   * Clamped on the way out rather than written back, so that a coordinate
   * pushed out of range by a change to the data is restored when the data
   * comes back — and so the effect below cannot chase its own output.
   */
  const focus = clampFocus(stored, rowCount, columnCount);

  /**
   * Whether the browser's focus still has to be moved to match. Without it
   * every render would pull focus into the grid, including the first.
   */
  const pending = useRef(false);

  useEffect(() => {
    if (!pending.current) {
      return;
    }
    pending.current = false;
    const table = tableRef.current;
    if (table === null) {
      return;
    }
    cellAt(table, { rowIndex: focus.rowIndex, columnIndex: focus.columnIndex })
      // Focusing the cell the browser already sits on is a no-op, which is what
      // makes one method serve both a key press and a cell reporting a click.
      ?.focus();
  }, [tableRef, focus.rowIndex, focus.columnIndex]);

  /** How many rows fit the viewport, which is what a page key should move. */
  function pageSize(): number {
    const table = tableRef.current;
    const firstRow = table?.tBodies[0]?.rows[0];
    const viewport = table?.parentElement;
    if (
      firstRow === undefined ||
      viewport === null ||
      viewport === undefined ||
      firstRow.offsetHeight === 0
    ) {
      return FALLBACK_PAGE;
    }
    return Math.max(
      1,
      Math.floor(viewport.clientHeight / firstRow.offsetHeight),
    );
  }

  function focusCell(rowIndex: number, columnIndex: number): void {
    const next = clampFocus({ rowIndex, columnIndex }, rowCount, columnCount);
    if (
      next.rowIndex === focus.rowIndex &&
      next.columnIndex === focus.columnIndex
    ) {
      return;
    }
    pending.current = true;
    setStored(next);
  }

  function tabIndexFor(rowIndex: number, columnIndex: number): 0 | -1 {
    return rowIndex === focus.rowIndex && columnIndex === focus.columnIndex
      ? 0
      : -1;
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLElement>): void {
    // Alt on an arrow resizes and Ctrl on one reorders; the header claims both
    // before this runs, and elsewhere they belong to the browser.
    if (event.altKey) {
      return;
    }

    const { rowIndex, columnIndex } = focus;
    let next: GridFocus;

    switch (event.key) {
      case "ArrowLeft":
        if (event.ctrlKey) return;
        next = { rowIndex, columnIndex: columnIndex - 1 };
        break;
      case "ArrowRight":
        if (event.ctrlKey) return;
        next = { rowIndex, columnIndex: columnIndex + 1 };
        break;
      case "ArrowUp":
        next = { rowIndex: rowIndex - 1, columnIndex };
        break;
      case "ArrowDown":
        next = { rowIndex: rowIndex + 1, columnIndex };
        break;
      // Ctrl takes Home and End to the grid's ends rather than the row's, which
      // is the one place Ctrl is navigation rather than reorder.
      case "Home":
        next = event.ctrlKey
          ? { rowIndex: HEADER_ROW, columnIndex: 0 }
          : { rowIndex, columnIndex: 0 };
        break;
      case "End":
        next = event.ctrlKey
          ? { rowIndex: rowCount - 1, columnIndex: columnCount - 1 }
          : { rowIndex, columnIndex: columnCount - 1 };
        break;
      case "PageUp":
        next = { rowIndex: rowIndex - pageSize(), columnIndex };
        break;
      case "PageDown":
        next = { rowIndex: rowIndex + pageSize(), columnIndex };
        break;
      default:
        return;
    }

    // Taken even when the move lands nowhere: an arrow at the last row would
    // otherwise scroll the page out from under the grid.
    event.preventDefault();
    focusCell(next.rowIndex, next.columnIndex);
  }

  // A new object each render, as the other hooks here return: the handlers
  // close over the focus they move from.
  return { focus, tabIndexFor, focusCell, onKeyDown };
}
