# @gridkitjs/react

## 0.3.0

### Minor Changes

- 1e112a6: `ColumnDefinition`'s new `wrap`, `headerClassName`, and `cellClassName`
  fields now render: `wrap.header`/`wrap.cells` add an `is-wrapped` class to
  that column's `th`/`td` (rendered by `@gridkitjs/theme-tailwind` as
  `white-space: normal`), and `headerClassName`/`cellClassName` are appended
  to the same elements as-is.

### Patch Changes

- Updated dependencies [1e112a6]
  - @gridkitjs/core@0.3.0

## 0.2.0

### Minor Changes

- 7f0645b: `DataGrid` can reorder its columns by drag and drop. Set `reorderableColumns`
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

### Patch Changes

- Updated dependencies [7f0645b]
  - @gridkitjs/core@0.2.0

## 0.1.0

### Minor Changes

- e0f5b59: Columns take `headerTemplate` in place of `header`, and a new `cellTemplate`
  renders a column's cells.

  `{ field: "Id", header: "#" }` becomes `{ field: "Id", headerTemplate: "#" }`.

  `cellTemplate` receives `{ value, row, rowIndex }` and returns whatever the
  adapter renders — in React, `cellTemplate: ({ value }) => <b>{value}</b>`.
  `value` is the cell's own value read off the field path, so a template that
  only formats it never repeats the path. A column without one renders the raw
  value as before.

- 401a2cc: Address nested fields with `"Parent.Child"` paths, and derive columns from data

  `ColumnDefinition["field"]` now autocompletes one level of nesting via the new
  `FieldPath<Row>` type, while still accepting any string so a path the type
  cannot see is never a hard error. `defineColumnsFromRows` derives a column per
  field across a set of rows, in first-seen order and without duplicates.

  `ColumnDefinition` takes a second type parameter for what a header renders to.
  It defaults to `string` in `@gridkitjs/core`, which stays framework-agnostic;
  `@gridkitjs/react` exports a `ColumnDefinition<Row>` alias bound to `ReactNode`,
  so a header callback can return JSX. This replaces the untyped `Function`.

- a3db97e: Resolve a column's label, resizability and alignment in core

  `ResolvedColumn` gains `label`, `resizable` and `alignment`, so it now describes
  a column completely rather than only its width. `resolveColumnWidths` decides
  all three: a header is resolved eagerly or by calling it, falling back to a
  label read off the field path; `resizable` takes the column's own setting over
  the grid's; alignment falls back to the column's type. A second framework
  adapter renders identically without repeating any of it.

  `resolveColumnWidths` takes a `ColumnResolveOptions` object as its third
  argument in place of the size defaults — `{ sizes: { width: 60 } }` where it was
  `{ width: 60 }` — since the grid-level defaults are no longer only sizes.
  `resolveColumnLabel`, `alignmentForType` and `KEYBOARD_STEP` are exported for
  adapters that resolve columns themselves.

  Columns that set a numeric `type` without an explicit `alignment` now align
  right, matching columns inferred from data — previously only the inferred ones
  did. Numeric alignment covers `decimal`, `currency` and `percent` alongside
  `number`. A column with `header: ""` now renders an empty header instead of
  falling back to its field name.

- 45e492c: Size, resize and auto-fit columns

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

### Patch Changes

- Updated dependencies [e0f5b59]
- Updated dependencies [401a2cc]
- Updated dependencies [a3db97e]
- Updated dependencies [45e492c]
  - @gridkitjs/core@0.1.0
