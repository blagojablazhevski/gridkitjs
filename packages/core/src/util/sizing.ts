import type {
  ColumnConstraints,
  ColumnDefinition,
  ColumnResizeSession,
  ColumnSizeDefaults,
  ColumnSizingState,
  ResolvedColumn,
} from "../types";
import { getColumnId } from "./grid";

/**
 * Applied to any column that does not size itself. The minimum is a width a
 * header stays legible at rather than a measured value — a column dragged
 * narrower than this reads as a rendering fault.
 */
export const DEFAULT_COLUMN_SIZES: ColumnSizeDefaults = {
  width: 150,
  minWidth: 40,
  maxWidth: Number.POSITIVE_INFINITY,
};

function withDefaults(
  defaults?: Partial<ColumnSizeDefaults>,
): ColumnSizeDefaults {
  return { ...DEFAULT_COLUMN_SIZES, ...defaults };
}

/**
 * The bounds `column` may be sized between. Resolved in one place so that a
 * drag, a clamp and an auto-fit cannot disagree about a column's limits.
 */
export function resolveColumnConstraints<Row>(
  column: ColumnDefinition<Row, unknown>,
  defaults?: Partial<ColumnSizeDefaults>,
): ColumnConstraints {
  const resolved = withDefaults(defaults);
  return {
    minWidth: column.minWidth ?? resolved.minWidth,
    maxWidth: column.maxWidth ?? resolved.maxWidth,
  };
}

/** Holds `width` within `constraints`. */
export function clampColumnWidth(
  width: number,
  constraints: ColumnConstraints,
): number {
  return Math.min(Math.max(width, constraints.minWidth), constraints.maxWidth);
}

/**
 * Pairs each column with the width it renders at, taking the first of the
 * sizing state, the column's own `width`, and the default — then clamping.
 *
 * The sizing state winning means a user's drag outlives a re-render; a column
 * absent from it still tracks a `width` edited in the definition.
 */
export function resolveColumnWidths<Row, Header>(
  columns: readonly ColumnDefinition<Row, Header>[],
  sizing: ColumnSizingState,
  defaults?: Partial<ColumnSizeDefaults>,
): readonly ResolvedColumn<Row, Header>[] {
  const resolved = withDefaults(defaults);

  return columns.map((column) => {
    const id = getColumnId(column);
    const stored = sizing[id];

    return {
      column,
      id,
      sized: stored !== undefined,
      width: clampColumnWidth(
        stored ?? column.width ?? resolved.width,
        resolveColumnConstraints(column, resolved),
      ),
    };
  });
}

export function totalColumnWidth<Row, Header>(
  resolved: readonly ResolvedColumn<Row, Header>[],
): number {
  return resolved.reduce((total, entry) => total + entry.width, 0);
}

/**
 * Opens a resize. The session captures its constraints and starting point up
 * front, so applying a pointer position later is arithmetic on numbers alone —
 * which is what keeps the drag testable without a DOM.
 *
 * @param startPosition Where the pointer went down, on the axis being dragged.
 */
export function beginColumnResize<Row>(
  column: ColumnDefinition<Row, unknown>,
  startWidth: number,
  startPosition: number,
  defaults?: Partial<ColumnSizeDefaults>,
): ColumnResizeSession {
  return {
    columnId: getColumnId(column),
    startWidth,
    startPosition,
    constraints: resolveColumnConstraints(column, defaults),
  };
}

/**
 * The width the dragged column takes with the pointer at `position`. The delta
 * is signed, so a right-to-left adapter negates it and nothing else changes.
 */
export function applyColumnResize(
  session: ColumnResizeSession,
  position: number,
): number {
  return clampColumnWidth(
    session.startWidth + (position - session.startPosition),
    session.constraints,
  );
}

/**
 * Grows columns proportionally until they fill `availableWidth`.
 *
 * Growth only: columns that already meet or exceed the width are returned
 * untouched, so a container too narrow for them scrolls rather than crushing
 * them. Columns the user has sized are left at that width and the rest share
 * what is left, so dragging one column does not rubber-band it back.
 */
export function fitColumnsToWidth<Row, Header>(
  resolved: readonly ResolvedColumn<Row, Header>[],
  availableWidth: number,
  defaults?: Partial<ColumnSizeDefaults>,
): readonly ResolvedColumn<Row, Header>[] {
  const target = Math.floor(availableWidth);
  if (resolved.length === 0 || totalColumnWidth(resolved) >= target) {
    return resolved;
  }

  const entries = resolved.map((entry) => ({
    entry,
    width: entry.width,
    maxWidth: resolveColumnConstraints(entry.column, defaults).maxWidth,
    growable: !entry.sized,
  }));
  const sum = () => entries.reduce((total, item) => total + item.width, 0);

  // Clamping a column at its maximum frees surplus the others have to absorb,
  // so a pass that clamped anything is followed by another.
  for (;;) {
    const growing = entries.filter(
      (item) => item.growable && item.width < item.maxWidth,
    );
    const surplus = target - sum();
    if (surplus <= 0 || growing.length === 0) {
      break;
    }

    const base = growing.reduce((total, item) => total + item.width, 0);
    let clamped = false;

    for (const item of growing) {
      const share =
        base === 0 ? surplus / growing.length : (surplus * item.width) / base;

      if (item.width + share >= item.maxWidth) {
        item.width = item.maxWidth;
        clamped = true;
      } else {
        item.width += share;
      }
    }

    if (!clamped) {
      break;
    }
  }

  // Fractional widths would leave the table a sub-pixel short of its container
  // and show a scrollbar that never goes away, so floor every column and hand
  // the lost pixels back out one at a time.
  let remainder = target - entries.reduce((t, i) => t + Math.floor(i.width), 0);

  return entries.map((item) => {
    let width = Math.floor(item.width);
    if (remainder > 0 && item.growable && width < item.maxWidth) {
      width += 1;
      remainder -= 1;
    }
    return { ...item.entry, width };
  });
}

/**
 * The width a column needs to show `measuredWidth` of content.
 *
 * `padding` is an allowance on top of the measurement, since a column sized to
 * exactly its content can still round down into an ellipsis.
 */
export function sizeColumnToContent(
  measuredWidth: number,
  constraints: ColumnConstraints,
  padding = 2,
): number {
  return clampColumnWidth(Math.ceil(measuredWidth + padding), constraints);
}
