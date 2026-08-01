import { accessDotted } from "@gridkit/core";
import { type ReactNode } from "react";
import type { ColumnDefinition } from "../DataGrid";

interface GridBodyProps<Row> {
  columns?: readonly ColumnDefinition<Row>[] | undefined;
  dataSource?: readonly Row[] | undefined;
}

export default function GridBody<Row>({
  columns,
  dataSource,
}: GridBodyProps<Row>) {
  return (
    <tbody className="grid-body">
      {dataSource?.map((row, index) => (
        <tr key={index} className="grid-row">
          {columns?.map((column) => (
            <td key={column.field} className="grid-cell">
              {accessDotted(row, column.field) as ReactNode}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
