import type { Dispatch, SetStateAction } from "react";
import {
  sortDirectionFor,
  sortPriorityFor,
  toggleColumnSort,
  type ColumnSortEvent,
  type ColumnSortState,
  type SortDirection,
} from "@gridkitjs/core";
import type { ResolvedColumn } from "./DataGrid";
import { commitIfChanged } from "./commitIfChanged";

interface UseColumnSortOptions {
  sort: ColumnSortState;
  setSort: Dispatch<SetStateAction<ColumnSortState>>;
  onColumnSortChange?: ((event: ColumnSortEvent) => void) | undefined;
}

export interface ColumnSortApi<Row> {
  sort: ColumnSortState;
  /** This column's direction, or `null` if it takes no part in the sort. */
  directionFor: (columnId: string) => SortDirection | null;
  /**
   * This column's 1-based place in the stack, or `null` outside it. Only
   * meaningful once two or more columns are stacked.
   */
  priorityFor: (columnId: string) => number | null;
  /** Cycles `entry`'s sort. A `shiftKey` stacks it; its absence replaces the stack. */
  toggle: (entry: ResolvedColumn<Row>, event: { shiftKey: boolean }) => void;
}

/**
 * Turns a click or keypress into a sort. Every transition it produces comes
 * from `@gridkitjs/core`; this hook only supplies the state to transform and
 * reports the result.
 */
export default function useColumnSort<Row>({
  sort,
  setSort,
  onColumnSortChange,
}: UseColumnSortOptions): ColumnSortApi<Row> {
  function toggle(
    entry: ResolvedColumn<Row>,
    event: { shiftKey: boolean },
  ): void {
    const next = toggleColumnSort(sort, entry.id, { stack: event.shiftKey });
    commitIfChanged(sort, next, setSort, (committed) => {
      onColumnSortChange?.({ columnId: entry.id, sort: committed });
    });
  }

  // A new object each render, as the other hooks here return.
  return {
    sort,
    directionFor: (columnId) => sortDirectionFor(sort, columnId),
    priorityFor: (columnId) => sortPriorityFor(sort, columnId),
    toggle,
  };
}
