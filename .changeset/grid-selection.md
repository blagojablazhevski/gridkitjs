---
"@gridkitjs/react": minor
---

Rows, columns and cells can be selected. `selectable` says which and how many
of each — off by default, since selection claims the click:

```tsx
<DataGridComponent
  dataSource={rows}
  getRowId={(row) => row.Id}
  selectable={{ rows: "multiple", columns: "multiple", cells: "single" }}
  onRowSelect={({ row }) => console.log(row.row.Name)}
  onRowSelectionChange={({ added, removed, selected }) => persist(selected)}
/>
```

A cell takes `false | "single"` rather than a mode of its own — it addresses one
value, so there is no range to take.

Click replaces, Ctrl-click toggles and Shift-click takes a range; from the
keyboard, Space toggles the focused row or column, Enter replaces, `Ctrl+A`
takes every row and Escape lets them all go. Rows and cells report
`aria-selected`, and the grid `aria-multiselectable`.

Thirteen callbacks report it — `onRowSelect`, `onRowsSelect`, `onRowDeselect`,
`onRowsDeselect` and `onRowSelectionChange`, the same five for columns, and
`onCellSelect` / `onCellDeselect` / `onCellSelectionChange`. Each carries the
resolved row, column or cell value rather than a bare id, and all of them are
fanned out from one diff, so no two can disagree about what an interaction did.
`defaultRowSelection`, `defaultColumnSelection` and `defaultCellSelection` set
the starting state.

Give `getRowId` alongside `selectable` for data that sorts, filters or pages:
without it a row is identified by its position, so a re-sort leaves the same
positions selected under different rows.
