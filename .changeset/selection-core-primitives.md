---
"@gridkitjs/core": minor
---

Selection primitives, ahead of the grid wiring them up. `toggleSelection`,
`selectOnly`, `selectRange`, `selectAll` and `clearSelection` transform an
ordered `SelectionState` of ids under a `SelectionMode` of `false | "single" |
"multiple"`; `selectCell` and `toggleCellSelection` do the same for the single
`CellSelectionState`. Each returns its input by reference when nothing changed,
as `moveColumnBefore` does, so a caller can skip a render and an event on that
alone. `diffSelection` reports what one transition added and removed.

`resolveRowId(row, index, getRowId?)` settles a row's identity, the counterpart
to `getColumnId` — falling back to the row's position when no `getRowId` is
given, which is enough for a static grid but ties row state to where a row sits
rather than to the row.

`CellTemplateContext` gains `rowId` and `selected`, so a template can key off
its row or style itself to match the selection:

```ts
cellTemplate: ({ value, rowId, selected }) =>
  selected ? <strong id={rowId}>{value}</strong> : value;
```
