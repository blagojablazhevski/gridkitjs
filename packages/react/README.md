# @gridkitjs/react

React data-grid components built on
[`@gridkitjs/core`](https://www.npmjs.com/package/@gridkitjs/core).

> **Early development.** The API is still moving and may break between minor
> versions.

```bash
pnpm add @gridkitjs/react
```

```tsx
import { defineColumnsFromRows } from "@gridkitjs/core";
import { DataGridComponent, type ColumnDefinition } from "@gridkitjs/react";

const rows = [
  { Id: 1, Application: { Id: 9, Name: "Portal" }, Cost: 1250.5 },
  { Id: 2, Application: { Id: 4, Name: "Admin" }, Cost: 87.25 },
];

type Row = (typeof rows)[number];

const columns: readonly ColumnDefinition<Row>[] = [
  ...defineColumnsFromRows(rows),
  { field: "Cost", id: "Cost.currency", type: "currency", header: "Cost" },
];

<DataGridComponent
  dataSource={rows}
  columns={columns}
  resizableColumns
  resizeMode="fit"
/>;
```

Columns can be inferred from the data or declared outright — a column's `type`
drives its default alignment. With `resizableColumns`, a column edge can be
dragged to resize or double-clicked to fit its content. `resizeMode="fit"`
keeps columns filling the grid; `"fixed"` lets each keep its own width.

Requires React 19.

Full documentation: [github.com/blagojablazhevski/gridkit](https://github.com/blagojablazhevski/gridkit#readme)

## License

MIT © Blagoja Blazhevski
