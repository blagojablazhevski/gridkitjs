import { useState } from "react";
import { defineColumnsFromRows } from "@gridkitjs/core";
import {
  DataGridComponent,
  type ColumnDefinition,
  type ResizeMode,
} from "@gridkitjs/react";

interface PropRow {
  name: string;
  type: string;
  default?: string;
  description: string;
}

const propColumns: readonly ColumnDefinition<PropRow>[] = [
  {
    field: "name",
    headerTemplate: "Prop",
    cellTemplate: ({ value }) => (
      <code className="text-xs text-black">{String(value)}</code>
    ),
  },
  {
    field: "type",
    headerTemplate: "Type",
    wrap: { header: true, cells: true },
    cellTemplate: ({ value }) => (
      <code className="text-xs text-gray-600">{String(value)}</code>
    ),
  },
  {
    field: "default",
    headerTemplate: "Default",
    cellTemplate: ({ value }) => (
      <code className="text-xs text-gray-600">
        {typeof value === "string" && value !== "" ? value : "—"}
      </code>
    ),
  },
  {
    field: "description",
    headerTemplate: "Description",
    wrap: { header: true, cells: true },
    cellClassName: "text-gray-600",
  },
];

const propRows: readonly PropRow[] = [
  {
    name: "columns",
    type: "readonly ColumnDefinition<Row>[]",
    description:
      "Columns to render. Falls back to defineColumnsFromRows(dataSource) when omitted.",
  },
  {
    name: "dataSource",
    type: "readonly Row[]",
    description: "The rows to render.",
  },
  {
    name: "getRowId",
    type: "(row: Row, index: number) => string",
    default: "row position",
    description:
      "A row's stable identity, for state keyed by it. Give one for data that sorts, filters or pages.",
  },
  {
    name: "label",
    type: "string",
    description:
      "The grid's accessible name, announced when it takes focus. Use labelledBy for a heading already on the page.",
  },
  {
    name: "borders",
    type: '"horizontal" | "vertical" | "all" | "none"',
    description: "Which cell borders to draw.",
  },
  {
    name: "hoverable",
    type: "{ rows?, columns?, cells? }",
    description: "Which hover highlighting to enable.",
  },
  {
    name: "selectable",
    type: '{ rows?, columns?: false | "single" | "multiple", cells?: false | "single" }',
    default: "all off",
    description:
      "Which parts of the grid the user may select, and how many of each. Off by default: selection claims the click.",
  },
  {
    name: "onRowSelect / onRowsSelect",
    type: "(event) => void",
    description:
      "One per row selected, and one per interaction with all of them. Deselect and SelectionChange pairs alongside, and the same set for columns and cells.",
  },
  {
    name: "resizableColumns",
    type: "boolean",
    default: "false",
    description:
      "Whether columns can be dragged wider, unless a column says otherwise.",
  },
  {
    name: "reorderableColumns",
    type: "boolean",
    default: "false",
    description: "Whether columns can be dragged into a new position.",
  },
  {
    name: "resizeMode",
    type: '"fit" | "fixed"',
    default: '"fit"',
    description: "Whether columns fill the grid's width or sit at their own.",
  },
];

function PropsTable() {
  return (
    <div className="w-full rounded-xl border border-gray-300 border-b-0">
      <DataGridComponent
        columns={propColumns}
        dataSource={propRows}
        getRowId={(row) => row.name}
        label="DataGrid props"
        resizeMode="fit"
        borders="horizontal"
        hoverable={{ rows: false, cells: false, columns: false }}
      />
    </div>
  );
}

const rows = [
  {
    Id: 1,
    Tags: ["ops"],
    Application: { Id: 9, Name: "Portal" },
    Cost: 1250.5,
  },
  { Id: 2, Status: "ok", Application: { Id: 4, Name: "Admin" }, Cost: 87.25 },
  { Id: 3, Status: "ok", Application: { Id: 7, Name: "Billing" }, Cost: 2410 },
  {
    Id: 4,
    Status: "warn",
    Application: { Id: 2, Name: "Search" },
    Cost: 340.8,
  },
  { Id: 5, Status: "ok", Application: { Id: 5, Name: "Reports" }, Cost: 19.99 },
  { Id: 6, Status: "warn", Application: { Id: 1, Name: "Auth" }, Cost: 1875.4 },
];

type Row = (typeof rows)[number];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// Assignable to the ReactNode-bound alias despite defaulting to `string`.
const columns: readonly ColumnDefinition<Row>[] = [
  ...defineColumnsFromRows(rows),
  // Declared rather than inferred, so its alignment comes from `type` alone.
  {
    field: "Cost",
    id: "Cost.currency",
    type: "currency",
    headerTemplate: <span className="italic">Cost</span>,
    cellTemplate: ({ value, row }) => (
      <span className={row.Cost > 1000 ? "font-bold text-red-600" : ""}>
        {currency.format(Number(value))}
      </span>
    ),
  },
];

const modes: readonly { value: ResizeMode; description: string }[] = [
  { value: "fit", description: "columns fill the grid" },
  { value: "fixed", description: "columns keep their own width" },
];

export default function App() {
  const [resizeMode, setResizeMode] = useState<ResizeMode>("fit");
  /** The last thing each selection callback reported, newest first. */
  const [log, setLog] = useState<readonly string[]>([]);

  function record(entry: string): void {
    setLog((entries) => [entry, ...entries].slice(0, 8));
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">GridKit Playground</h1>
      <p className="mt-2 text-sm text-gray-600">
        Import from <code>@gridkitjs/react</code> and render it here. Drag a
        column edge to resize, or double-click it to fit the content. Drag a
        header itself to reorder — or focus one and press{" "}
        <code>Ctrl+Arrow</code>. Tab into the grid and the arrow keys move cell
        to cell; <code>Space</code> selects, <code>Shift+Click</code> takes a
        range, <code>Ctrl+A</code> takes every row and <code>Escape</code> lets
        them go.
      </p>
      <fieldset className="mt-4 flex gap-4 text-sm">
        <legend className="sr-only">Resize mode</legend>
        {modes.map((mode) => (
          <label key={mode.value} className="flex items-center gap-1.5">
            <input
              type="radio"
              name="resize-mode"
              value={mode.value}
              checked={resizeMode === mode.value}
              onChange={() => {
                setResizeMode(mode.value);
              }}
            />
            <code>{mode.value}</code>
            <span className="text-gray-600">{mode.description}</span>
          </label>
        ))}
      </fieldset>
      <div className="mt-4">
        <DataGridComponent
          columns={columns}
          dataSource={rows}
          getRowId={(row) => String(row.Id)}
          label="Application costs"
          borders="all"
          resizableColumns
          reorderableColumns
          resizeMode={resizeMode}
          selectable={{
            rows: "multiple",
            columns: "multiple",
            cells: "single",
          }}
          onRowSelect={({ row }) => {
            record(`onRowSelect — ${row.row.Application.Name}`);
          }}
          onRowsSelect={({ rows: selected }) => {
            record(`onRowsSelect — ${String(selected.length)} row(s)`);
          }}
          onRowDeselect={({ row }) => {
            record(`onRowDeselect — ${row.row.Application.Name}`);
          }}
          onRowSelectionChange={({ added, removed, selected }) => {
            record(
              `onRowSelectionChange — +${String(added.length)} -${String(removed.length)}, ${String(selected.length)} selected`,
            );
          }}
          onColumnSelect={({ column }) => {
            record(`onColumnSelect — ${column.column.column.field}`);
          }}
          onCellSelect={({ cell }) => {
            record(
              `onCellSelect — ${cell.columnId} of row ${cell.rowId} = ${String(cell.value)}`,
            );
          }}
        />
      </div>
      <h2 className="mt-8 text-lg font-bold">Selection callbacks</h2>
      <ol className="mt-2 min-h-24 rounded border border-gray-300 p-2 text-xs">
        {log.length === 0 ? (
          <li className="text-gray-500">
            Click, Ctrl+Click or Shift+Click a row, a header or a cell.
          </li>
        ) : (
          log.map((entry, index) => (
            <li key={`${entry}-${String(index)}`}>
              <code>{entry}</code>
            </li>
          ))
        )}
      </ol>
      <h2 className="mt-8 text-lg font-bold">
        PropsTable, in a 360px-wide panel
      </h2>
      <div className="mt-2 w-90 border border-dashed border-red-400 p-2">
        <PropsTable />
      </div>
    </main>
  );
}
