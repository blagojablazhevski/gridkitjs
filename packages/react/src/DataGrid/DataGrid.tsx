import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  applyColumnOrder,
  defineColumnsFromRows,
  fitColumnsToWidth,
  moveColumnBefore,
  resolveColumnWidths,
  resolveRowId,
  totalColumnWidth,
  type ColumnDefinition as CoreColumnDefinition,
  type ResolvedColumn as CoreResolvedColumn,
  type ColumnOrderEvent,
  type ColumnOrderState,
  type ColumnResizeEvent,
  type ColumnSizeDefaults,
  type ColumnSizingState,
  type ResolvedRow,
} from "@gridkitjs/core";
import GridHeader from "./components/GridHeader";
import GridBody from "./components/GridBody";
import useColumnDrag, { type DropTarget } from "./useColumnDrag";
import useColumnResize from "./useColumnResize";
import useElementWidth from "./useElementWidth";
import useGridNavigation, { HEADER_ROW } from "./useGridNavigation";

/**
 * A column whose header and cells may render arbitrary React content.
 * @gridkitjs/core stays framework-agnostic and so leaves that output type open;
 * this is the binding React consumers want, and the one they should import.
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
  /**
   * A row's stable identity, for state keyed by it. Defaults to the row's
   * position, which is enough for a static grid but ties that state to where a
   * row sits rather than to the row — so anything sorting, filtering or paging
   * its data should give one.
   *
   * Called for every row on every change to `dataSource`, so it should be
   * cheap and stable; an inline arrow is fine, one that re-reads the data is
   * not.
   */
  getRowId?: ((row: Row, index: number) => string) | undefined;
  borders?: Borders | undefined;
  hoverable?: HoverableConfig | undefined;
  /** Whether columns can be dragged wider, unless a column says otherwise. */
  resizableColumns?: boolean | undefined;
  /**
   * Whether columns can be dragged into a new position, unless a column says
   * otherwise. Turning it off leaves an order the user already made in place.
   */
  reorderableColumns?: boolean | undefined;
  /**
   * Whether columns fill the grid's width or sit at their own. Defaults to
   * `"fit"`, under which columns the user has sized keep their width and the
   * rest share what is left.
   */
  resizeMode?: ResizeMode | undefined;
  /** Column widths to start from, keyed by column id. Uncontrolled. */
  defaultColumnSizing?: ColumnSizingState | undefined;
  /**
   * Column ids in the order to start in. Uncontrolled, and partial: ids it
   * omits keep their position among `columns` and follow those it lists.
   */
  defaultColumnOrder?: ColumnOrderState | undefined;
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
  /**
   * Called once when the user drops a column somewhere new. A drop that leaves
   * the order as it was does not call it.
   */
  onColumnOrderChange?: ((event: ColumnOrderEvent) => void) | undefined;
  /**
   * The grid's accessible name, announced when it takes focus. A grid without
   * one is read only as "grid", which says nothing about which grid.
   */
  label?: string | undefined;
  /**
   * The id of an element naming the grid, for a heading already on the page.
   * Takes precedence over `label`, as `aria-labelledby` does.
   */
  labelledBy?: string | undefined;
}

export function DataGridComponent<Row>({
  dataSource,
  columns,
  getRowId,
  borders,
  hoverable,
  resizableColumns = false,
  reorderableColumns = false,
  resizeMode = "fit",
  defaultColumnSizing,
  defaultColumnOrder,
  columnSizeDefaults,
  onColumnResize,
  onColumnOrderChange,
  label,
  labelledBy,
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
  const [order, setOrder] = useState<ColumnOrderState>(
    defaultColumnOrder ?? [],
  );
  const [announcement, setAnnouncement] = useState("");

  /**
   * The rows as rendered, each carrying the id everything downstream keys it
   * by. Resolved once here rather than per consumer so a row's id cannot come
   * out differently in two places — the same reason `resolveColumnWidths` runs
   * once ahead of the header and the body.
   *
   * An array rather than a map keyed by id: two rows given the same id is a
   * caller's mistake, and one that should render twice and look wrong rather
   * than silently lose a row.
   */
  const rows = useMemo<readonly ResolvedRow<Row>[]>(
    () =>
      dataSource?.map((row, rowIndex) => ({
        rowId: resolveRowId(row, rowIndex, getRowId),
        row,
        rowIndex,
      })) ?? [],
    [dataSource, getRowId],
  );

  const definedColumns = useMemo<readonly ColumnDefinition<Row>[]>(() => {
    if (columns && columns.length !== 0) return columns;
    if (dataSource && dataSource.length > 0)
      return defineColumnsFromRows(dataSource);
    return [];
  }, [columns, dataSource]);

  /**
   * Ahead of sizing, so everything downstream reads one already-ordered list
   * and no part of the grid has to know a reorder happened.
   */
  const orderedColumns = useMemo(
    () => applyColumnOrder(definedColumns, order),
    [definedColumns, order],
  );

  /**
   * Auto-fit is a derivation rather than a write back into `sizing`, so that a
   * `width` set in a column definition is never overwritten and the effect
   * cannot chase its own output. `"fixed"` is then simply the absence of it.
   */
  const resolved = useMemo(() => {
    const widths = resolveColumnWidths(orderedColumns, sizing, {
      sizes: columnSizeDefaults,
      resizable: resizableColumns,
      reorderable: reorderableColumns,
    });
    return resizeMode === "fit" && viewportWidth !== null
      ? fitColumnsToWidth(widths, viewportWidth, columnSizeDefaults)
      : widths;
  }, [
    orderedColumns,
    sizing,
    resizeMode,
    viewportWidth,
    columnSizeDefaults,
    resizableColumns,
    reorderableColumns,
  ]);

  /**
   * What a column is called in an announcement. `label` carries whatever a
   * `headerTemplate` returned, which need not be text at all, so the field
   * path stands in whenever it is not.
   */
  function columnName(columnId: string): string {
    const entry = resolved.find((candidate) => candidate.id === columnId);
    if (entry === undefined) {
      return columnId;
    }
    return typeof entry.label === "string" ? entry.label : entry.column.field;
  }

  /**
   * Reports a change no visual cue can carry to a screen reader. Held as state
   * rather than written to the DOM directly so React owns the one element the
   * live region watches.
   */
  function announce(message: string): void {
    setAnnouncement(message);
  }

  /**
   * Wrapped rather than announced from the resize hook, which reports the
   * continuous `"move"` phase as well — a live region given every frame of a
   * drag says nothing an assistive technology can keep up with.
   */
  function handleColumnResize(event: ColumnResizeEvent): void {
    onColumnResize?.(event);
    if (event.phase === "end") {
      announce(
        `${columnName(event.columnId)}, ${String(Math.round(event.width))} pixels wide`,
      );
    }
  }

  const resize = useColumnResize<Row>({
    tableRef,
    sizing,
    setSizing,
    columnSizeDefaults,
    onColumnResize: handleColumnResize,
  });

  const nav = useGridNavigation({
    tableRef,
    rowCount: rows.length,
    columnCount: resolved.length,
  });

  /**
   * The ids as displayed, which a drop is expressed against — the order state
   * starts empty and may name only some columns, so moving against it directly
   * would have nothing to rearrange.
   */
  const displayedIds = useMemo(
    () => orderedColumns.map((column) => column.id ?? column.field),
    [orderedColumns],
  );

  /**
   * The one place a drop is applied. A second drop zone — a grouping bar above
   * the header — turns this into a switch on `target.kind` and touches nothing
   * else.
   */
  function handleDrop(target: DropTarget, movedId: string): void {
    const next = moveColumnBefore(displayedIds, movedId, target.beforeId);
    // `moveColumnBefore` hands back the same reference for a move that changes
    // nothing, so a drop in place neither renders nor reports.
    if (next === displayedIds) {
      return;
    }
    const position = next.indexOf(movedId);
    setOrder(next);
    onColumnOrderChange?.({ columnId: movedId, order: next });
    announce(
      `${columnName(movedId)}, column ${String(position + 1)} of ${String(next.length)}`,
    );
    /**
     * The tab stop travels with the column. React reorders the headers by key,
     * so the browser's focus stays on the moved one by itself — without this
     * the stop would be left on whichever column took its index, and the next
     * arrow key would appear to do nothing.
     */
    nav.focusCell(HEADER_ROW, position);
  }

  const drag = useColumnDrag<Row>({ order: displayedIds, onDrop: handleDrop });

  return (
    <div className="gridkit-data-grid-viewport" ref={viewportRef}>
      <table
        ref={tableRef}
        /*
         * `role="grid"` rather than the table's own semantics: it is what makes
         * the arrow keys a navigation the grid owns, and later what lets a row
         * report whether it is selected. It obliges the single tab stop
         * `useGridNavigation` keeps.
         */
        role="grid"
        // The header is a row too, and counted from one.
        aria-rowcount={rows.length + 1}
        aria-colcount={resolved.length}
        {...(labelledBy !== undefined && { "aria-labelledby": labelledBy })}
        {...(labelledBy === undefined &&
          label !== undefined && { "aria-label": label })}
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
        <GridHeader<Row>
          columns={resolved}
          resize={resize}
          drag={drag}
          nav={nav}
        />
        <GridBody<Row>
          columns={resolved}
          rows={rows}
          activeColumnId={resize.activeColumnId}
          nav={nav}
        />
      </table>
      {/*
       * Outside the table, which admits no `div`, and polite so it waits for a
       * pause rather than cutting across what the user is already hearing.
       */}
      <div className="gridkit-sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
