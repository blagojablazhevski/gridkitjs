---
"@gridkit/core": minor
"@gridkit/react": minor
---

Resolve a column's label, resizability and alignment in core

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
