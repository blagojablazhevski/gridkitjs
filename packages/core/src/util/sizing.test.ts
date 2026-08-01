import { describe, expect, test } from "vitest";

import type { ColumnDefinition, ResolvedColumn } from "../types";
import {
  applyColumnResize,
  beginColumnResize,
  clampColumnWidth,
  DEFAULT_COLUMN_SIZES,
  fitColumnsToWidth,
  resolveColumnConstraints,
  resolveColumnWidths,
  sizeColumnToContent,
  totalColumnWidth,
} from "./sizing";

interface SampleRow {
  Id: number;
  Name: string;
  Status: string;
}

function widthsOf(resolved: readonly ResolvedColumn<SampleRow>[]): number[] {
  return resolved.map((entry) => entry.width);
}

/** Three equal columns, the shape most auto-fit cases start from. */
const equalColumns: readonly ColumnDefinition<SampleRow>[] = [
  { field: "Id", width: 100 },
  { field: "Name", width: 100 },
  { field: "Status", width: 100 },
];

describe("resolveColumnConstraints", () => {
  test("prefers the column's own bounds over the defaults", () => {
    const constraints = resolveColumnConstraints<SampleRow>({
      field: "Id",
      minWidth: 80,
    });

    expect(constraints).toEqual({
      minWidth: 80,
      maxWidth: DEFAULT_COLUMN_SIZES.maxWidth,
    });
  });

  test("takes overridden defaults for bounds the column omits", () => {
    const constraints = resolveColumnConstraints<SampleRow>(
      { field: "Id" },
      { minWidth: 10, maxWidth: 500 },
    );

    expect(constraints).toEqual({ minWidth: 10, maxWidth: 500 });
  });
});

describe("clampColumnWidth", () => {
  test("holds a width within its bounds", () => {
    const constraints = { minWidth: 50, maxWidth: 200 };

    expect(clampColumnWidth(20, constraints)).toBe(50);
    expect(clampColumnWidth(120, constraints)).toBe(120);
    expect(clampColumnWidth(900, constraints)).toBe(200);
  });
});

describe("resolveColumnWidths", () => {
  test("takes the sizing state over the column, and the column over the default", () => {
    const columns: readonly ColumnDefinition<SampleRow>[] = [
      { field: "Id", width: 90 },
      { field: "Name" },
      { field: "Status", width: 120 },
    ];

    const resolved = resolveColumnWidths(columns, { Status: 300 });

    expect(widthsOf(resolved)).toEqual([90, DEFAULT_COLUMN_SIZES.width, 300]);
  });

  test("clamps every source, including a width that came from the state", () => {
    const columns: readonly ColumnDefinition<SampleRow>[] = [
      { field: "Id", minWidth: 100 },
      { field: "Name", maxWidth: 120 },
    ];

    const resolved = resolveColumnWidths(columns, { Id: 10, Name: 900 });

    expect(widthsOf(resolved)).toEqual([100, 120]);
  });

  test("falls back to an overridden default width", () => {
    const resolved = resolveColumnWidths<SampleRow, string>(
      [{ field: "Id" }, { field: "Name", width: 90 }],
      {},
      { width: 60 },
    );

    expect(widthsOf(resolved)).toEqual([60, 90]);
  });

  test("marks only the columns whose width came from the state", () => {
    const resolved = resolveColumnWidths(equalColumns, { Name: 200 });

    expect(resolved.map((entry) => entry.sized)).toEqual([false, true, false]);
  });

  test("keys the state by id when a column carries one", () => {
    const columns: readonly ColumnDefinition<SampleRow>[] = [
      { field: "Name", id: "name-short" },
      { field: "Name", id: "name-long" },
    ];

    const resolved = resolveColumnWidths(columns, { "name-long": 400 });

    expect(widthsOf(resolved)).toEqual([DEFAULT_COLUMN_SIZES.width, 400]);
  });

  test("returns nothing for no columns", () => {
    expect(resolveColumnWidths([], {})).toEqual([]);
    expect(totalColumnWidth([])).toBe(0);
  });
});

describe("applyColumnResize", () => {
  const column: ColumnDefinition<SampleRow> = {
    field: "Id",
    minWidth: 60,
    maxWidth: 300,
  };
  const session = beginColumnResize(column, 100, 500);

  test("moves the width by the distance the pointer travelled", () => {
    expect(applyColumnResize(session, 560)).toBe(160);
  });

  test("returns the starting width for a pointer that has not moved", () => {
    expect(applyColumnResize(session, 500)).toBe(100);
  });

  test("shrinks on a leftward drag and stops at the minimum", () => {
    expect(applyColumnResize(session, 470)).toBe(70);
    expect(applyColumnResize(session, 100)).toBe(60);
  });

  test("stops at the maximum on a rightward drag", () => {
    expect(applyColumnResize(session, 5000)).toBe(300);
  });

  test("captures the column's id, so the drag survives a reorder", () => {
    expect(beginColumnResize({ field: "Name", id: "n" }, 10, 0).columnId).toBe(
      "n",
    );
  });
});

describe("fitColumnsToWidth", () => {
  function fit(
    columns: readonly ColumnDefinition<SampleRow>[],
    sizing: Readonly<Record<string, number>>,
    available: number,
  ): number[] {
    return widthsOf(
      fitColumnsToWidth(resolveColumnWidths(columns, sizing), available),
    );
  }

  test("shares the surplus in proportion to the current widths", () => {
    const columns: readonly ColumnDefinition<SampleRow>[] = [
      { field: "Id", width: 100 },
      { field: "Name", width: 200 },
      { field: "Status", width: 100 },
    ];

    expect(fit(columns, {}, 800)).toEqual([200, 400, 200]);
  });

  test("fills the width exactly when the share does not divide evenly", () => {
    const widths = fit(equalColumns, {}, 401);

    expect(widths.reduce((total, width) => total + width, 0)).toBe(401);
    expect(widths).toEqual([134, 134, 133]);
  });

  test("leaves the columns alone when they already exceed the width", () => {
    expect(fit(equalColumns, {}, 200)).toEqual([100, 100, 100]);
  });

  test("redistributes what a column clamped at its maximum could not take", () => {
    const columns: readonly ColumnDefinition<SampleRow>[] = [
      { field: "Id", width: 100 },
      { field: "Name", width: 100, maxWidth: 120 },
      { field: "Status", width: 100 },
    ];

    expect(fit(columns, {}, 600)).toEqual([240, 120, 240]);
  });

  test("holds a column the user sized and grows only the rest", () => {
    expect(fit(equalColumns, { Name: 100 }, 400)).toEqual([150, 100, 150]);
  });

  test("stops short rather than growing columns that are all sized", () => {
    const widths = fit(equalColumns, { Id: 100, Name: 100, Status: 100 }, 900);

    expect(widths).toEqual([100, 100, 100]);
  });

  test("stops short when every column has reached its maximum", () => {
    const columns = equalColumns.map((column) => ({
      ...column,
      maxWidth: 120,
    }));

    expect(fit(columns, {}, 900)).toEqual([120, 120, 120]);
  });

  test("returns nothing for no columns", () => {
    expect(fitColumnsToWidth([], 500)).toEqual([]);
  });
});

describe("sizeColumnToContent", () => {
  const constraints = { minWidth: 60, maxWidth: 300 };

  test("adds the padding allowance and rounds up", () => {
    expect(sizeColumnToContent(120.2, constraints)).toBe(123);
  });

  test("stays within the column's bounds", () => {
    expect(sizeColumnToContent(10, constraints)).toBe(60);
    expect(sizeColumnToContent(900, constraints)).toBe(300);
  });
});
