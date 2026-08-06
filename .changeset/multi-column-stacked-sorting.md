---
"@gridkitjs/core": minor
"@gridkitjs/react": minor
"@gridkitjs/theme-tailwind": patch
---

Added multi-column stacked sorting. A header's sort toggle cycles a column
through ascending, descending, and off; Shift-click adds or updates a column
in the stack instead of replacing it, sorted in priority order. Configure
with `sortableColumns` / `column.sortable`, seed with `defaultColumnSort`,
and listen with `onColumnSortChange`.
