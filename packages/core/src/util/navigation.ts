/**
 * The header's row index. One coordinate space covers the header and the body
 * so that arrowing up out of the first row reaches the header without a case
 * of its own, and every other move is plain arithmetic.
 */
export const HEADER_ROW = -1;

/** The cell the grid's single tab stop sits on. */
export interface GridFocus {
  readonly rowIndex: number;
  readonly columnIndex: number;
}

/** The modifier keys held with a navigation key press. */
export interface NavigationModifiers {
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly altKey: boolean;
  readonly shiftKey: boolean;
}

/**
 * Holds a coordinate inside the grid, so that a focus surviving a column
 * removal or a shorter page never leaves the grid with no tab stop at all —
 * which is a grid a keyboard cannot reach.
 */
export function clampFocus(
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
 * The focus a navigation key press moves to, or `null` when the key isn't
 * this grid's to handle — left for the browser or another handler.
 *
 * `pageSize` is a pre-measured row count rather than a callback: this
 * function takes plain data only, so a caller measures the viewport once and
 * hands over the number.
 */
export function nextFocusForKey(
  key: string,
  modifiers: NavigationModifiers,
  focus: GridFocus,
  rowCount: number,
  columnCount: number,
  pageSize: number,
): GridFocus | null {
  // Alt on an arrow resizes and Ctrl on one reorders; the header claims both
  // before this runs, and elsewhere they belong to the browser.
  if (modifiers.altKey) {
    return null;
  }

  const { rowIndex, columnIndex } = focus;

  switch (key) {
    case "ArrowLeft":
      if (modifiers.ctrlKey) return null;
      return { rowIndex, columnIndex: columnIndex - 1 };
    case "ArrowRight":
      if (modifiers.ctrlKey) return null;
      return { rowIndex, columnIndex: columnIndex + 1 };
    case "ArrowUp":
      return { rowIndex: rowIndex - 1, columnIndex };
    case "ArrowDown":
      return { rowIndex: rowIndex + 1, columnIndex };
    // Ctrl takes Home and End to the grid's ends rather than the row's, which
    // is the one place Ctrl is navigation rather than reorder.
    case "Home":
      return modifiers.ctrlKey
        ? { rowIndex: HEADER_ROW, columnIndex: 0 }
        : { rowIndex, columnIndex: 0 };
    case "End":
      return modifiers.ctrlKey
        ? { rowIndex: rowCount - 1, columnIndex: columnCount - 1 }
        : { rowIndex, columnIndex: columnCount - 1 };
    case "PageUp":
      return { rowIndex: rowIndex - pageSize, columnIndex };
    case "PageDown":
      return { rowIndex: rowIndex + pageSize, columnIndex };
    default:
      return null;
  }
}
