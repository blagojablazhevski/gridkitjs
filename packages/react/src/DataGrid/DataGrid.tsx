import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  defineColumnsFromRows,
  fitColumnsToWidth,
  resolveColumnWidths,
  totalColumnWidth,
  type ColumnDefinition as CoreColumnDefinition,
  type ResolvedColumn as CoreResolvedColumn,
  type ColumnResizeEvent,
  type ColumnSizeDefaults,
  type ColumnSizingState,
} from "@gridkitjs/core";
import GridHeader from "./components/GridHeader";
import GridBody from "./components/GridBody";
import useColumnResize from "./useColumnResize";
import useElementWidth from "./useElementWidth";

/**
 * A column whose header may render arbitrary React content. @gridkitjs/core
 * stays framework-agnostic and so leaves that output type open; this is the
 * binding React consumers want, and the one they should import.
 */
export type ColumnDefinition<Row> = CoreColumnDefinition<Row, ReactNode>;

/** A column paired with the width it renders at. */
export type ResolvedColumn<Row> = CoreResolvedColumn<Row, ReactNode>;

export type Borders = "horizontal" | "vertical" | "all" | "none";

/**
 * How a column's width relates to the grid's.
 *
 * `"fit"` keeps the columns filling the grid: the space a column gives up is
 * handed to the others, and the space it takes comes out of them. `"fixed"`
 * lets every column keep its own width, so a resize moves one column and
 * nothing else, and the grid scrolls or leaves a gap accordingly.
 */
export type ResizeMode = "fit" | "fixed";

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
  /** Whether columns can be dragged wider, unless a column says otherwise. */
  resizableColumns?: boolean | undefined;
  /**
   * Whether columns fill the grid's width or sit at their own. Defaults to
   * `"fit"`, under which columns the user has sized keep their width and the
   * rest share what is left.
   */
  resizeMode?: ResizeMode | undefined;
  /** Column widths to start from, keyed by column id. Uncontrolled. */
  defaultColumnSizing?: ColumnSizingState | undefined;
  /**
   * Sizes applied to columns that do not set their own — the width they start
   * at and the bounds they may be resized between. Distinct from
   * `defaultColumnSizing`, which sets specific columns' starting widths.
   */
  columnSizeDefaults?: Partial<ColumnSizeDefaults> | undefined;
  /**
   * Called as the user resizes a column. Fires continuously with
   * `phase: "move"` and once on release with `phase: "end"` — the latter being
   * the one to persist. Auto-fit does not call it; it reports user intent only.
   */
  onColumnResize?: ((event: ColumnResizeEvent) => void) | undefined;
}

export function DataGridComponent<Row>({
  dataSource,
  columns,
  borders,
  hoverable,
  resizableColumns = false,
  resizeMode = "fit",
  defaultColumnSizing,
  columnSizeDefaults,
  onColumnResize,
}: DataGridProps<Row>) {
  const hoverRows = hoverable?.rows ?? true;
  const hoverColumns = hoverable?.columns ?? true;
  const hoverCells = hoverable?.cells ?? true;

  const viewportRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const viewportWidth = useElementWidth(viewportRef, resizeMode === "fit");
  const [sizing, setSizing] = useState<ColumnSizingState>(
    defaultColumnSizing ?? {},
  );

  const definedColumns = useMemo<readonly ColumnDefinition<Row>[]>(() => {
    if (columns && columns.length !== 0) return columns;
    if (dataSource && dataSource.length > 0)
      return defineColumnsFromRows(dataSource);
    return [];
  }, [columns, dataSource]);

  /**
   * Auto-fit is a derivation rather than a write back into `sizing`, so that a
   * `width` set in a column definition is never overwritten and the effect
   * cannot chase its own output. `"fixed"` is then simply the absence of it.
   */
  const resolved = useMemo(() => {
    const widths = resolveColumnWidths(definedColumns, sizing, {
      sizes: columnSizeDefaults,
      resizable: resizableColumns,
    });
    return resizeMode === "fit" && viewportWidth !== null
      ? fitColumnsToWidth(widths, viewportWidth, columnSizeDefaults)
      : widths;
  }, [
    definedColumns,
    sizing,
    resizeMode,
    viewportWidth,
    columnSizeDefaults,
    resizableColumns,
  ]);

  const resize = useColumnResize<Row>({
    tableRef,
    sizing,
    setSizing,
    columnSizeDefaults,
    onColumnResize,
  });

  return (
    <div className="gridkit-data-grid-viewport" ref={viewportRef}>
      <table
        ref={tableRef}
        // Widths are only honoured exactly when the table is as wide as its
        // columns; at `100%` the fixed layout redistributes the difference.
        style={{ width: totalColumnWidth(resolved) }}
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
        <colgroup>
          {resolved.map((entry) => (
            <col key={entry.id} style={{ width: entry.width }} />
          ))}
        </colgroup>
        <GridHeader<Row> columns={resolved} resize={resize} />
        <GridBody<Row>
          columns={resolved}
          dataSource={dataSource}
          activeColumnId={resize.activeColumnId}
        />
      </table>
    </div>
  );
}
