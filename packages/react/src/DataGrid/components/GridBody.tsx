import { accessDotted } from "@gridkitjs/core";
import { type ReactNode } from "react";
import type { ResolvedColumn } from "../DataGrid";

interface GridBodyProps<Row> {
  columns: readonly ResolvedColumn<Row>[];
  dataSource?: readonly Row[] | undefined;
  /** The column being resized, so its cells outline with its header. */
  activeColumnId: string | null;
}

export default function GridBody<Row>({
  columns,
  dataSource,
  activeColumnId,
}: GridBodyProps<Row>) {
  return (
    <tbody className="grid-body">
      {dataSource?.map((row, index) => (
        <tr key={index} className="grid-row">
          {columns.map(({ id, column, alignment }) => {
            // Resolved either way, so a template that only formats the value
            // never has to walk the field path a second time.
            const value = accessDotted(row, column.field);

            return (
              <td
                key={id}
                data-gridkit-column={id}
                className={
                  id === activeColumnId ? "grid-cell is-resizing" : "grid-cell"
                }
                style={{ textAlign: alignment }}
              >
                {column.cellTemplate
                  ? column.cellTemplate({ value, row, rowIndex: index })
                  : (value as ReactNode)}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );
}
