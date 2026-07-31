import { defineColumnsFromRows } from "@gridkit/core";
import { DataGridComponent, type ColumnDefinition } from "@gridkit/react";

const rows = [
  { Id: 1, Tags: ["ops"], Application: { Id: 9, Name: "Portal" } },
  { Id: 2, Status: "ok", Application: { Id: 4, Name: "Admin" } },
];

type Row = (typeof rows)[number];

// Assignable to the ReactNode-bound alias despite defaulting to `string`.
const columns: readonly ColumnDefinition<Row>[] = [
  ...defineColumnsFromRows(rows),
];

export default function App() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">GridKit Playground</h1>
      <p className="mt-2 text-sm text-gray-600">
        Import from <code>@gridkit/react</code> and render it here.
      </p>
      <DataGridComponent columns={columns} dataSource={rows} />
    </main>
  );
}
