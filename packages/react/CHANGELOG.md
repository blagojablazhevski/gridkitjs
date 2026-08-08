# @gridkitjs/react

## 0.6.0

### Minor Changes

- ac7695f: `DataGrid` accessibility fixes, closing gaps found auditing it against the
  WAI-ARIA grid pattern:

  - Selecting a cell now announces it (e.g. "name, row 2, selected") via the
    grid's existing live region. Previously a grid configured with only cell
    selection gave a screen-reader user no feedback at all when selecting a
    cell — unlike row and column selection, which already announced counts.
  - New keyboard shortcut: `Alt+Enter` on a focused, resizable column header
    sizes that column to its content — the keyboard equivalent of
    double-clicking its resize handle. Advertised via `aria-keyshortcuts`
    alongside the existing resize/reorder/sort shortcuts, so `buildKeyShortcuts`
    (`@gridkitjs/core`) now includes `Alt+Enter` in its output for a resizable
    column.
  - Header `<th>` cells now set `role="columnheader"` explicitly, matching the
    explicit `role="gridcell"`/`role="row"` already set on body cells and rows,
    rather than relying on `<th scope="col">`'s implicit role mapping inside a
    `role="grid"` table.
  - Body `<td>` cells now set `aria-keyshortcuts="Space Enter"` when cell
    selection is enabled, matching the shortcuts header cells already
    advertise.

- ac7695f: `Borders` and `HoverableConfig` — the types behind `DataGridComponent`'s
  `borders` and `hoverable` props — are now exported from `@gridkitjs/react`.
- ac7695f: `DataGridComponent` accepts a `ref` prop typed `Ref<DataGridApi<Row>>`. The
  handle exposes the grid's live column sizing/order/sort, row/column/cell
  selection, resolved rows/columns, and the focused cell, plus `focusCell`,
  `clearSelection`, `selectAllRows`, `scrollToRow`, and `scrollToColumn`.

### Patch Changes

- ac7695f: Internal refactor of `DataGrid`'s implementation: pointer-drag lifecycles
  (column resize, column reorder), "compute next state, bail if unchanged,
  persist, notify" selection/sort commits, conditional class-name and ARIA
  attribute construction, keyboard select-intent handling, and a couple of
  `useMemo`-derived lookup structures now go through shared internal helpers
  instead of five-plus near-duplicate copies. No public API or rendered
  behavior changes for a correct caller.

  One deliberate exception: `useColumnResize`'s `commit` was already missing
  the bail-if-unchanged guard the other commit-style call sites have, so its
  `"move"`-phase `onColumnResize` calls during a drag pinned against a
  min/max clamp were left as-is (still firing on every pointer move) rather
  than silently gaining a new guard — kept out of the shared
  `commitIfChanged` helper on purpose, with a comment at the call site.

- ac7695f: `@gridkitjs/core` now exports pure grid logic that previously lived only
  inside `@gridkitjs/react`'s `DataGrid` hooks, so a future non-React binding
  (or any consumer working directly against `core`) can reuse it instead of
  reimplementing it:

  - `clampFocus`, `nextFocusForKey`, `HEADER_ROW`, and the `GridFocus`/
    `NavigationModifiers` types — the header/body focus-navigation state
    machine.
  - `intentOf` and `applySelectionIntent`, plus the `SelectIntent` type —
    reading a click or key press's modifiers into an intent, and applying it
    to a `SelectionState`.
  - `resolveRows`, `resolveColumns`, and `resolveCell` — resolving selected
    ids back to the row/column/cell records behind them, dropping any id whose
    row or column no longer exists.
  - `resolveKeyboardDropTarget` — the `beforeId` a keyboard column-reorder
    nudge produces, matching the pointer-drag drop path already in
    `moveColumnBefore`.
  - `buildKeyShortcuts` (and the `KeyShortcutCapabilities` type) — the
    `aria-keyshortcuts` string for a column header.
  - `revertColumnSize` — the sizing-state merge a cancelled resize reverts to.

  `@gridkitjs/react`'s `DataGrid` hooks (`useGridNavigation`,
  `useGridSelection`, `useColumnDrag`, `useColumnResize`) and `GridHeader` now
  call these instead of defining them locally. No behavior change for a
  correct caller — this is the same logic, moved.

- Updated dependencies [ac7695f]
- Updated dependencies [ac7695f]
  - @gridkitjs/core@0.7.0

## 0.5.0

### Minor Changes

- 26adc6f: Added filtering infrastructure: `FilterState`/`FilterEntry` — a discriminated
  union of a `%`-wildcard text query, a typed exact-value match (type-scoped:
  a number never matches a string column), a custom predicate, or a nested
  `GroupFilterEntry` for AND/OR composition — ANDed together across top-level
  entries. Added the core `filterRows` / `setColumnFilter` / `clearAllFilters`
  / `filterQueryFor` / `matchesQuery` functions, and `resolveShownRows`, which
  composes filtering and sorting. Seed a grid's filter with `defaultFilter` on
  `DataGridComponent`. No header or toolbar UI ships yet — pre-filter
  `dataSource` yourself with the exported functions, or seed `defaultFilter`,
  until it does.
- 26adc6f: Added multi-column stacked sorting. A header's sort toggle cycles a column
  through ascending, descending, and off; Shift-click adds or updates a column
  in the stack instead of replacing it, sorted in priority order. Configure
  with `sortableColumns` / `column.sortable`, seed with `defaultColumnSort`,
  and listen with `onColumnSortChange`.

### Patch Changes

- 26adc6f: Fixed a bug where cancelling a column drag with `Escape` could discard another
  column's width if that column was resized via keyboard while the drag was
  still in progress. The cancelled column now reverts on its own, leaving
  concurrent changes to other columns intact.
- 26adc6f: Fixed a spurious `onColumnResize` "end" event firing when a resize handle's
  pointer is released with no intervening move — including each of the two
  clicks that make up a double-click.
- 26adc6f: Fixed `sizeToContent` (double-click a resize handle) measuring the header's
  own label as if it were a data cell when the grid has no rows, instead of
  correctly doing nothing.
- Updated dependencies [26adc6f]
- Updated dependencies [26adc6f]
  - @gridkitjs/core@0.6.0

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
