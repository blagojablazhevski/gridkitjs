---
"@gridkitjs/core": minor
"@gridkitjs/react": minor
---

`DataGrid` accessibility fixes, closing gaps found auditing it against the
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
