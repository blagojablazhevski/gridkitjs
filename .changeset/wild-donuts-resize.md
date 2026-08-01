---
"@gridkitjs/core": minor
"@gridkitjs/react": minor
---

Size, resize and auto-fit columns

`ColumnDefinition` gains `width`, `minWidth`, `maxWidth` and `resizable`, plus an
optional `id` that state is keyed by and that defaults to `field`. Every width
calculation lives in `@gridkitjs/core` — `resolveColumnWidths` applies the
precedence (sizing state, then the column, then the default) and clamps;
`beginColumnResize`/`applyColumnResize` turn a pointer position into a width;
`fitColumnsToWidth` distributes a container's width across columns. A future
adapter for another framework inherits all of it.

`DataGridComponent` takes `resizableColumns`, `resizeMode`, `onColumnResize` and
two sizing props that read alike but differ: `defaultColumnSizing` sets the
starting width of specific columns, keyed by id, while `columnSizeDefaults` sets
the width and bounds used for any column that does not size itself. Columns can
be dragged by their right edge, resized with the arrow keys, and sized to their
content by double-clicking the handle.

`resizeMode` chooses what a resize does to the other columns. Under the default
`"fit"`, columns fill the grid: auto-fit leaves those the user has sized alone
and shares the remaining width between the rest, so a column giving up space
hands it to its neighbours. Under `"fixed"`, every column keeps its own width —
a resize moves one column and nothing else, and the grid scrolls or leaves a gap
to suit.

The grid now renders inside a scrolling wrapper and sizes its columns through a
`<colgroup>` with `table-layout: fixed`, which is what makes a width exact.
Cell content that does not fit its column is truncated with an ellipsis instead
of wrapping.
