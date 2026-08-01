import { useState } from "react";
import { defineColumnsFromRows } from "@gridkitjs/core";
import {
  DataGridComponent,
  type ColumnDefinition,
  type ResizeMode,
} from "@gridkitjs/react";

const rows = [
  {
    Id: 1,
    Tags: ["ops"],
    Application: { Id: 9, Name: "Portal" },
    Cost: 1250.5,
  },
  { Id: 2, Status: "ok", Application: { Id: 4, Name: "Admin" }, Cost: 87.25 },
];

type Row = (typeof rows)[number];

// Assignable to the ReactNode-bound alias despite defaulting to `string`.
const columns: readonly ColumnDefinition<Row>[] = [
  ...defineColumnsFromRows(rows),
  // Declared rather than inferred, so its alignment comes from `type` alone.
  { field: "Cost", id: "Cost.currency", type: "currency", header: "Cost" },
];

const modes: readonly { value: ResizeMode; description: string }[] = [
  { value: "fit", description: "columns fill the grid" },
  { value: "fixed", description: "columns keep their own width" },
];

export default function App() {
  const [resizeMode, setResizeMode] = useState<ResizeMode>("fit");

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">GridKit Playground</h1>
      <p className="mt-2 text-sm text-gray-600">
        Import from <code>@gridkitjs/react</code> and render it here. Drag a
        column edge to resize, or double-click it to fit the content.
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
          borders="all"
          resizableColumns
          resizeMode={resizeMode}
        />
      </div>
    </main>
  );
}
