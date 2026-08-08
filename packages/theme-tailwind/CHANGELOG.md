# @gridkitjs/theme-tailwind

## 0.3.2

### Patch Changes

- 29f2c39: The last row's cells no longer draw a bottom border under `borders-horizontal` or `borders-all` — previously it rendered as a stray extra edge below the table.

## 0.3.1

### Patch Changes

- 26adc6f: Added multi-column stacked sorting. A header's sort toggle cycles a column
  through ascending, descending, and off; Shift-click adds or updates a column
  in the stack instead of replacing it, sorted in priority order. Configure
  with `sortableColumns` / `column.sortable`, seed with `defaultColumnSort`,
  and listen with `onColumnSortChange`.

## 0.3.0

### Minor Changes

- f30a2a9: A focus ring on the focused header or body cell, drawn in `--gridkit-accent`.
  The grid is one tab stop with the arrow keys moving within it, so the ring is
  the only sign of where that stop is.

  Two new hooks for the styles to target: `.gridkit-sr-only`, which hides the
  grid's live region visually while leaving it in the accessibility tree, and
  `.header-cell.is-reorderable` for the grab affordance — every header is
  focusable now, so a `tabindex` no longer picks out the ones that drag.

- 4a92413: Styles for a selected row, column or cell, on two new palette tokens:
  `--gridkit-selected`, and `--gridkit-selected-strong` for one that is also
  hovered — hover already claims `--gridkit-surface-muted`, so without a second
  token a selected row would lose its highlight under the pointer.

  New classes the stylesheet targets: `is-selected` on a row, header cell or body
  cell, and `selectable-rows` / `selectable-columns` / `selectable-cells` on the
  grid itself. The last three enable rather than disable, the opposite of
  `no-hover-*` — hover is on by default and selection is off, so each class
  follows its own default.

  A grid that opts into row or cell selection also stops its cells' text being
  drag-selected, or a Shift-click meant to take a range of rows would smear the
  browser's own highlight across every cell it crossed.

## 0.2.3

### Patch Changes

- a157b54: Fixed `borders="all"` still drawing a left-edge line on the first column. The table-level `box-shadow` meant to repaint that stripped edge didn't align with `border-collapse: collapse` and left a stray line behind; the outer left/right edges are now simply left unset on the first/last cell, with nothing repainting them.

## 0.2.2

### Patch Changes

- 7dcffc9: A column with `wrap` enabled now breaks a word longer than the column instead
  of overflowing it — `white-space: normal` alone only breaks at spaces, so a
  long unbroken token (a URL, a long identifier) previously spilled past the
  column's fixed width.

## 0.2.1

### Patch Changes

- 76c62b1: Fix the grid overflowing its viewport by 1px under `borders="all"`. The first
  column's left border had no neighbour to collapse with, so it added a pixel
  the width calculations didn't account for — under `resizeMode="fit"` this
  clipped the last column's border and, in narrow layouts, its content.

## 0.2.0

### Minor Changes

- 1e112a6: Styles the new `is-wrapped` state `@gridkitjs/react` adds for a column with
  `wrap.header`/`wrap.cells` set: `overflow: visible`, `text-overflow: clip`,
  and `white-space: normal` in place of the grid's default single-line
  ellipsis, on just that column's header and/or cells.

## 0.1.0

### Minor Changes

- 7f0645b: Styles for column reordering. A header being dragged goes half-opaque and a
  copy of it trails the pointer, while the gap the column would drop into takes
  an accent line — drawn on the leading edge of the column after the gap, or the
  trailing edge of the last one. A reorderable header also takes a `grab` cursor
  and stops its label being selected mid-drag.
