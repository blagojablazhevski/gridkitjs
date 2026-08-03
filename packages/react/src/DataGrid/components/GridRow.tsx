import { accessDotted } from "@gridkitjs/core";
import { memo, type ReactNode } from "react";
import type { ResolvedColumn } from "../DataGrid";

interface GridRowProps<Row> {
  columns: readonly ResolvedColumn<Row>[];
  rowId: string;
  row: Row;
  rowIndex: number;
  /** The column being resized, so its cells outline with its header. */
  activeColumnId: string | null;
  selectedColumnIds: ReadonlySet<string>;
  selected: boolean;
  /** Which of this row's cells is the selected one, if any. */
  selectedColumnId: string | null;
  /** Which of this row's cells holds the grid's tab stop, if any. */
  focusedColumnIndex: number | null;
  rowsSelectable: boolean;
  cellsSelectable: boolean;
}

function GridRowComponent<Row>({
  columns,
  rowId,
  row,
  rowIndex,
  activeColumnId,
  selectedColumnIds,
  selected,
  selectedColumnId,
  focusedColumnIndex,
  rowsSelectable,
  cellsSelectable,
}: GridRowProps<Row>) {
  return (
    <tr
      role="row"
      // Two past the index: rows are counted from one, and the header is the
      // first of them.
      aria-rowindex={rowIndex + 2}
      // Omitted rather than `false` when rows cannot be selected, which would
      // otherwise have every row announce that it is not.
      {...(rowsSelectable && { "aria-selected": selected })}
      className={["grid-row", selected ? "is-selected" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      {columns.map(({ id, column, alignment }, columnIndex) => {
        // Resolved either way, so a template that only formats the value never
        // has to walk the field path a second time.
        const value = accessDotted(row, column.field);
        const cellSelected = id === selectedColumnId;

        return (
          <td
            key={id}
            role="gridcell"
            data-gridkit-column={id}
            aria-colindex={columnIndex + 1}
            tabIndex={columnIndex === focusedColumnIndex ? 0 : -1}
            {...(cellsSelectable && { "aria-selected": cellSelected })}
            className={[
              "grid-cell",
              id === activeColumnId ? "is-resizing" : "",
              cellSelected || selectedColumnIds.has(id) ? "is-selected" : "",
              column.wrap?.cells ? "is-wrapped" : "",
              column.cellClassName ?? "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ textAlign: alignment }}
          >
            {column.cellTemplate
              ? column.cellTemplate({ value, row, rowIndex, rowId, selected })
              : (value as ReactNode)}
          </td>
        );
      })}
    </tr>
  );
}

/**
 * Selection lives at the top of the grid, so any change to it re-renders the
 * whole body — without this boundary a click would rebuild every cell of every
 * row rather than the one or two rows that changed.
 *
 * Every prop above is a scalar or already memoised for that reason, and no
 * handler reaches here at all: the body delegates its events, so a row has
 * nothing to compare that changes each render.
 *
 * `memo` erases the type parameter, and the cast puts it back — the standard
 * price of memoising a generic component.
 */
const GridRow = memo(GridRowComponent) as typeof GridRowComponent;

export default GridRow;
