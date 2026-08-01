import type { ReactNode } from "react";
import type { ColumnDefinition as CoreColumnDefinition } from "@gridkit/core";
import GridHeader from "./components/GridHeader";
import GridBody from "./components/GridBody";

/**
 * A column whose header may render arbitrary React content. @gridkit/core
 * stays framework-agnostic and so leaves that output type open; this is the
 * binding React consumers want, and the one they should import.
 */
export type ColumnDefinition<Row> = CoreColumnDefinition<Row, ReactNode>;

export type Borders = "horizontal" | "vertical" | "all" | "none";

export interface HoverableConfig {
  rows?: boolean;
  columns?: boolean;
  cells?: boolean;
}

export interface DataGridProps<Row> {
  columns?: readonly ColumnDefinition<Row>[] | undefined;
  dataSource?: readonly Row[] | undefined;
  borders?: Borders | undefined;
  hoverable?: HoverableConfig | undefined;
}

export function DataGridComponent<Row>({
  dataSource,
  columns,
  borders,
  hoverable,
}: DataGridProps<Row>) {
  const hoverRows = hoverable?.rows ?? true;
  const hoverColumns = hoverable?.columns ?? true;
  const hoverCells = hoverable?.cells ?? true;

  return (
    <table
      className={[
        "gridkit-data-grid",
        borders ? `borders-${borders}` : "",
        hoverRows ? "" : "no-hover-rows",
        hoverColumns ? "" : "no-hover-columns",
        hoverCells ? "" : "no-hover-cells",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <GridHeader<Row> columns={columns} />
      <GridBody<Row> columns={columns} dataSource={dataSource} />
    </table>
  );
}
