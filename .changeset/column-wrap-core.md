---
"@gridkitjs/core": minor
---

Columns take a `wrap` option — `{ header?: boolean; cells?: boolean }` — and
two escape-hatch class fields, `headerClassName` and `cellClassName`.

`wrap` lets a column's header and/or cell text wrap onto multiple lines
instead of the grid's default single line with an ellipsis; it's off by
default, so existing grids render unchanged. `headerClassName`/
`cellClassName` are appended to a column's `th`/`td` as-is — nothing in this
package reads them — for styling a single column that no other prop covers.
