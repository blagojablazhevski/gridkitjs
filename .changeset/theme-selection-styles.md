---
"@gridkitjs/theme-tailwind": minor
---

Styles for a selected row, column or cell, on two new palette tokens:
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
