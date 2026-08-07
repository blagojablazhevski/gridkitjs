import { describe, expect, test } from "vitest";

import type {
  ColumnSortState,
  ColumnType,
  FilterState,
  ResolvedColumn,
  ResolvedRow,
} from "../types";
import { filterRows } from "./filtering";
import { resolveShownRows } from "./rows";
import { sortRows } from "./sorting";

interface SampleRow {
  Id: number;
  Name: string;
  Score: number;
}

function resolvedColumn(
  field: string,
  type?: ColumnType,
): ResolvedColumn<SampleRow, unknown> {
  return {
    column: { field, ...(type !== undefined && { type }) },
    id: field,
    width: 100,
    sized: false,
    label: field,
    resizable: false,
    reorderable: false,
    alignment: "left",
  };
}

const columns: readonly ResolvedColumn<SampleRow, unknown>[] = [
  resolvedColumn("Id", "number"),
  resolvedColumn("Name"),
  resolvedColumn("Score", "number"),
];

function resolvedRow(rowIndex: number, row: SampleRow): ResolvedRow<SampleRow> {
  return { rowId: String(row.Id), row, rowIndex };
}

const rows: readonly ResolvedRow<SampleRow>[] = [
  resolvedRow(0, { Id: 1, Name: "Dave", Score: 5 }),
  resolvedRow(1, { Id: 2, Name: "Alice", Score: 20 }),
  resolvedRow(2, { Id: 3, Name: "Bob", Score: 10 }),
];

describe("resolveShownRows", () => {
  test("filters and sorts together, matching manual filter-then-sort", () => {
    const filter: FilterState<SampleRow> = [{ columnId: "Name", query: "%a%" }];
    const sort: ColumnSortState = [{ columnId: "Score", direction: "desc" }];

    const composed = resolveShownRows(rows, filter, sort, columns);
    const manual = sortRows(filterRows(rows, filter, columns), sort, columns);

    expect(composed).toEqual(manual);
    expect(composed.map((entry) => entry.row.Id)).toEqual([2, 1]);
  });

  test("empty filter and empty sort return rows itself", () => {
    expect(resolveShownRows(rows, [], [], columns)).toBe(rows);
  });

  test("excludes a filtered-out row before ordering the remainder", () => {
    const filter: FilterState<SampleRow> = [
      {
        columnId: "Score",
        predicate: (value) => typeof value === "number" && value >= 10,
      },
    ];
    const sort: ColumnSortState = [{ columnId: "Score", direction: "asc" }];

    expect(
      resolveShownRows(rows, filter, sort, columns).map(
        (entry) => entry.row.Id,
      ),
    ).toEqual([3, 2]);
    // Unfiltered, the excluded row (the lowest score) would have sorted first.
    expect(sortRows(rows, sort, columns).map((entry) => entry.row.Id)).toEqual([
      1, 3, 2,
    ]);
  });

  test("only sort given behaves exactly like sortRows alone", () => {
    const sort: ColumnSortState = [{ columnId: "Score", direction: "asc" }];

    expect(resolveShownRows(rows, [], sort, columns)).toEqual(
      sortRows(rows, sort, columns),
    );
  });

  test("only filter given behaves exactly like filterRows alone", () => {
    const filter: FilterState<SampleRow> = [{ columnId: "Name", query: "%a%" }];

    expect(resolveShownRows(rows, filter, [], columns)).toEqual(
      filterRows(rows, filter, columns),
    );
  });
});
