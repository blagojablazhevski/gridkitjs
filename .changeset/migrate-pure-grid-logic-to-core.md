---
"@gridkitjs/core": minor
"@gridkitjs/react": patch
---

`@gridkitjs/core` now exports pure grid logic that previously lived only
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
