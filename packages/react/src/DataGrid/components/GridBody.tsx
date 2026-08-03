import { accessDotted, type ResolvedRow } from "@gridkitjs/core";
import { type ReactNode } from "react";
import type { ResolvedColumn } from "../DataGrid";

interface GridBodyProps<Row> {
  columns: readonly ResolvedColumn<Row>[];
  rows: readonly ResolvedRow<Row>[];
  /** The column being resized, so its cells outline with its header. */
  activeColumnId: string | null;
}

export default function GridBody<Row>({
  columns,
  rows,
  activeColumnId,
}: GridBodyProps<Row>) {
  return (
    <tbody className="grid-body">
      {rows.map(({ rowId, row, rowIndex }) => (
        <tr key={rowId} className="grid-row">
          {columns.map(({ id, column, alignment }) => {
            // Resolved either way, so a template that only formats the value
            // never has to walk the field path a second time.
            const value = accessDotted(row, column.field);

            return (
              <td
                key={id}
                data-gridkit-column={id}
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
