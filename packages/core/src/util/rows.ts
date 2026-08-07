import type {
  ColumnSortState,
  FilterState,
  ResolvedColumn,
  ResolvedRow,
} from "../types";
import { filterRows } from "./filtering";
import { sortRows } from "./sorting";

/**
 * `rows`, filtered then sorted — the one function `DataGrid.tsx` (and any
 * future framework binding) calls instead of composing `filterRows`/
 * `sortRows` itself.
 *
 * Filter always runs first: an O(n) pass that shrinks what the O(n log n)
 * sort has to touch whenever a filter is active, free when it isn't. This
 * is a performance choice, not a correctness one — filtering is an
 * order-preserving predicate and sort is a stable total order over whatever
 * it's handed, so the final order is identical either way.
 */
export function resolveShownRows<Row>(
  rows: readonly ResolvedRow<Row>[],
  filter: FilterState<Row>,
  sort: ColumnSortState,
  columns: readonly ResolvedColumn<Row, unknown>[],
): readonly ResolvedRow<Row>[] {
  return sortRows(filterRows(rows, filter, columns), sort, columns);
}
