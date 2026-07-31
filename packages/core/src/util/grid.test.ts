import { describe, expect, test } from "vitest";

import type { ColumnDefinition, FieldPath } from "../types";
import { accessDotted, defineColumnsFromRows } from "./grid";

interface Application {
  Id: number;
  Name: string;
  Owner: { Name: string };
}

interface SampleRow {
  Id: number;
  Tags: readonly string[];
  CreatedAt: Date;
  Application: Application;
}

const sampleRows: readonly SampleRow[] = [
  {
    Id: 1,
    Tags: ["a"],
    CreatedAt: new Date(0),
    Application: { Id: 9, Name: "Portal", Owner: { Name: "Ada" } },
  },
];

function fieldsOf(columns: readonly { field: string }[]): string[] {
  return columns.map((column) => column.field);
}

describe("defineColumnsFromRows", () => {
  test("derives one column per field, in key order", () => {
    const columns = defineColumnsFromRows([{ Id: 1, Name: "a" }]);

    expect(fieldsOf(columns)).toEqual(["Id", "Name"]);
  });

  test("flattens a nested object without emitting the object itself", () => {
    const columns = defineColumnsFromRows(sampleRows);

    expect(fieldsOf(columns)).toEqual([
      "Id",
      "Tags",
      "CreatedAt",
      "Application.Id",
      "Application.Name",
    ]);
  });

  test("skips objects nested more than one level deep", () => {
    const columns = defineColumnsFromRows([
      { Application: { Owner: { Name: "Ada" }, Id: 9 } },
    ]);

    expect(fieldsOf(columns)).toEqual(["Application.Id"]);
  });

  test("contributes nothing for an object with no leaf properties", () => {
    const columns = defineColumnsFromRows([
      { Id: 1, Application: { Owner: { Name: "Ada" } } },
    ]);

    expect(fieldsOf(columns)).toEqual(["Id"]);
  });

  test("treats arrays and dates as single cell values", () => {
    const columns = defineColumnsFromRows([
      { Tags: ["a", "b"], CreatedAt: new Date(0) },
    ]);

    expect(fieldsOf(columns)).toEqual(["Tags", "CreatedAt"]);
  });

  test("treats null as a leaf rather than something to drill into", () => {
    const columns = defineColumnsFromRows([{ Id: 1, Application: null }]);

    expect(fieldsOf(columns)).toEqual(["Id", "Application"]);
  });

  test("unions sparse rows in first-seen order without duplicates", () => {
    const columns = defineColumnsFromRows([
      { Id: 1, Name: "a" },
      { Id: 2, Status: "ok" },
      { Id: 3, Name: "b" },
    ]);

    expect(fieldsOf(columns)).toEqual(["Id", "Name", "Status"]);
  });

  test("returns nothing for empty input or rows that are not objects", () => {
    expect(defineColumnsFromRows([])).toEqual([]);
    expect(defineColumnsFromRows(["a", "b"])).toEqual([]);
  });
});

describe("FieldPath", () => {
  test("covers flat keys and one level of nesting", () => {
    const valid = [
      "Id",
      "Tags",
      "CreatedAt",
      "Application.Id",
      "Application.Name",
    ] satisfies FieldPath<SampleRow>[];

    expect(valid).toHaveLength(5);
  });

  test("excludes nested objects themselves and anything deeper", () => {
    const invalid: string[] = [
      // @ts-expect-error a nested object holds no cell value of its own
      "Application" satisfies FieldPath<SampleRow>,
      // @ts-expect-error two levels deep is beyond an addressable path
      "Application.Owner.Name" satisfies FieldPath<SampleRow>,
    ];

    expect(invalid).toHaveLength(2);
  });

  test("still accepts an arbitrary string, since it only drives DX", () => {
    const column: ColumnDefinition<SampleRow> = { field: "Application.Nmae" };

    expect(column.field).toBe("Application.Nmae");
  });
});

describe("ColumnDefinition", () => {
  test("widens to a richer header type, as @gridkit/react relies on", () => {
    // Stands in for ReactNode so this package stays framework-agnostic.
    const widened: readonly ColumnDefinition<SampleRow, string | object>[] =
      defineColumnsFromRows(sampleRows);

    expect(widened).toHaveLength(5);
  });

  test("accepts a header as either content or a lazy function", () => {
    const columns: readonly ColumnDefinition<SampleRow>[] = [
      { field: "Id", header: "Identifier" },
      { field: "Application.Name", header: () => "App name" },
    ];
    const [, lazy] = columns;

    expect(typeof lazy?.header).toBe("function");
  });
});

describe("accessDotted", () => {
  test("accesses a value at a dotted path", () => {
    const obj = { foo: { bar: { baz: "qux" } } };

    expect(accessDotted(obj, "foo.bar.baz")).toBe("qux");
  });
});
