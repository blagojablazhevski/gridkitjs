---
"@gridkitjs/core": minor
---

Column ordering, as the framework-agnostic half of drag-and-drop reordering.
`applyColumnOrder(columns, order)` permutes a column list by a
`ColumnOrderState` — an array of column ids that need not name every column,
so one it omits keeps its position among the definitions and follows those it
lists. `moveColumnBefore(order, movedId, beforeId)` produces the new order,
returning the array it was given when the move changes nothing, and
`resolveDropBefore(order, targetId, side)` turns a `"before"`/`"after"` hit
into the id to move in front of, and `movesColumn(order, movedId, beforeId)`
answers whether such a move would rearrange anything — the two gaps either
side of a column are drops that change nothing, so an adapter asks this before
offering one as a target.

Columns also take a `reorderable` flag, resolved by `resolveColumnWidths` from
the new `reorderable` option in the same way as `resizable` and surfaced on
`ResolvedColumn`.
