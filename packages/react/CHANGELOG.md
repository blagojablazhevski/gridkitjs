# @gridkitjs/react

## 0.4.0

### Minor Changes

- f30a2a9: The grid is now an ARIA grid a keyboard can navigate. It carries `role="grid"`
  with row and column counts and indices, headers carry `scope="col"`, and one
  roving tab stop moves cell to cell under the arrow keys, Home, End, Ctrl+Home,
  Ctrl+End and the page keys.

  Two changes to what a keyboard already did:

  - **Tab now passes the whole grid**, entering it once instead of stopping on
    every resize handle. The handles have left the tab order — a widget under
    `role="grid"` has one tab stop, and a grid of twenty columns previously had
    twenty.
  - **Keyboard resize moved to `Alt+ArrowLeft` / `Alt+ArrowRight`** on the focused
    header, from the bare arrows on its handle, which the grid now needs for
    navigation. `Ctrl+ArrowLeft` / `Ctrl+ArrowRight` still reorder.

  `label` and `labelledBy` give the grid its accessible name, without which a
  screen reader announces only "grid":

  ```tsx
  <DataGridComponent label="Application costs" ... />
  ```

  Reorders and resizes are announced through a live region, so a change with only
  a visual cue is no longer silent.

- f92198e: `DataGridComponent` takes `getRowId`, giving each row a stable identity for
  state keyed by it. Rows are keyed by it rather than by their array position, and
  `cellTemplate` receives it as `rowId` alongside a `selected` flag.

  ```tsx
  <DataGridComponent dataSource={rows} getRowId={(row) => row.Id} />
  ```

  Without it a row is identified by its position, which is enough for a static
  grid — so nothing has to change — but ties row state to where a row sits rather
  than to the row itself.

- 4a92413: Rows, columns and cells can be selected. `selectable` says which and how many
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

### Patch Changes

- Updated dependencies [f92198e]
  - @gridkitjs/core@0.5.0

## 0.3.1

### Patch Changes

- Updated dependencies [375c736]
  - @gridkitjs/core@0.4.0

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
