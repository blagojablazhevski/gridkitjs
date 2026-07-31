import type { ReactNode } from "react";
import {
  accessDotted,
  type ColumnDefinition as CoreColumnDefinition,
} from "@gridkit/core";

/**
 * A column whose header may render arbitrary React content. @gridkit/core
 * stays framework-agnostic and so leaves that output type open; this is the
 * binding React consumers want, and the one they should import.
 */
export type ColumnDefinition<Row> = CoreColumnDefinition<Row, ReactNode>;

export interface DataGridProps<Row> {
  columns?: readonly ColumnDefinition<Row>[];
  dataSource?: readonly Row[];
}

export function DataGridComponent<Row>({
  dataSource,
  columns,
}: DataGridProps<Row>) {
  return (
    <table className="gridkit-data-grid">
      <thead>
        <tr className="grid-header">
          {columns?.map((column) => (
            <th key={column.field} className="header-cell">
              {column.header
                ? typeof column.header === "function"
                  ? column.header()
                  : column.header
                : column.field.split(".").join(" ")}
            </th>
          ))}
        </tr>
      </thead>
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
    </table>
  );
}
