---
"@gridkitjs/react": minor
---

`DataGrid` can reorder its columns by drag and drop. Set `reorderableColumns`
to let the user drag a header to a new position; a column may opt out with
`reorderable: false` on its definition. Dragging a header anywhere on the cell
starts the move, a copy of the header follows the pointer, and the side of the
header the pointer is nearer to decides whether the column lands before or
after it.

Order is uncontrolled and mirrors sizing: `defaultColumnOrder` sets the order
to start in, and `onColumnOrderChange` reports each drop that changes it. A
focused header also moves with `Ctrl+ArrowLeft` / `Ctrl+ArrowRight`.

Turning `reorderableColumns` off stops further dragging but leaves an order the
user already made in place.
