---
"@gridkitjs/core": minor
"@gridkitjs/react": minor
---

Columns take `headerTemplate` in place of `header`, and a new `cellTemplate`
renders a column's cells.

`{ field: "Id", header: "#" }` becomes `{ field: "Id", headerTemplate: "#" }`.

`cellTemplate` receives `{ value, row, rowIndex }` and returns whatever the
adapter renders — in React, `cellTemplate: ({ value }) => <b>{value}</b>`.
`value` is the cell's own value read off the field path, so a template that
only formats it never repeats the path. A column without one renders the raw
value as before.
