---
"@gridkitjs/react": minor
---

`ColumnDefinition`'s new `wrap`, `headerClassName`, and `cellClassName`
fields now render: `wrap.header`/`wrap.cells` add an `is-wrapped` class to
that column's `th`/`td` (rendered by `@gridkitjs/theme-tailwind` as
`white-space: normal`), and `headerClassName`/`cellClassName` are appended
to the same elements as-is.
