import { accessDotted, type ResolvedRow } from "@gridkitjs/core";
import { type ReactNode } from "react";
import type { ResolvedColumn } from "../DataGrid";
import type { GridNavigationApi } from "../useGridNavigation";

interface GridBodyProps<Row> {
  columns: readonly ResolvedColumn<Row>[];
  rows: readonly ResolvedRow<Row>[];
  /** The column being resized, so its cells outline with its header. */
  activeColumnId: string | null;
  nav: GridNavigationApi;
}

export default function GridBody<Row>({
  columns,
  rows,
  activeColumnId,
  nav,
}: GridBodyProps<Row>) {
  return (
    <tbody className="grid-body">
      {rows.map(({ rowId, row, rowIndex }) => (
        // Two past the index: rows are counted from one, and the header is the
        // first of them.
        <tr
          key={rowId}
          className="grid-row"
          role="row"
          aria-rowindex={rowIndex + 2}
        >
          {columns.map(({ id, column, alignment }, columnIndex) => {
            // Resolved either way, so a template that only formats the value
            // never has to walk the field path a second time.
            const value = accessDotted(row, column.field);

            return (
              <td
                key={id}
                role="gridcell"
                data-gridkit-column={id}
                aria-colindex={columnIndex + 1}
                tabIndex={nav.tabIndexFor(rowIndex, columnIndex)}
                onFocus={() => {
                  nav.focusCell(rowIndex, columnIndex);
                }}
                onKeyDown={nav.onKeyDown}
                className={[
                  "grid-cell",
                  id === activeColumnId ? "is-resizing" : "",
                  column.wrap?.cells ? "is-wrapped" : "",
                  column.cellClassName ?? "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ textAlign: alignment }}
              >
                {column.cellTemplate
                  ? column.cellTemplate({
                      value,
                      row,
                      rowIndex,
                      rowId,
                      selected: false,
                    })
                  : (value as ReactNode)}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );
}
