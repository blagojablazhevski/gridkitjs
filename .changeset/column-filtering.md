---
"@gridkitjs/core": minor
"@gridkitjs/react": minor
---

Added filtering infrastructure: `FilterState`/`FilterEntry` — a discriminated
union of a `%`-wildcard text query, a typed exact-value match (type-scoped:
a number never matches a string column), a custom predicate, or a nested
`GroupFilterEntry` for AND/OR composition — ANDed together across top-level
entries. Added the core `filterRows` / `setColumnFilter` / `clearAllFilters`
/ `filterQueryFor` / `matchesQuery` functions, and `resolveShownRows`, which
composes filtering and sorting. Seed a grid's filter with `defaultFilter` on
`DataGridComponent`. No header or toolbar UI ships yet — pre-filter
`dataSource` yourself with the exported functions, or seed `defaultFilter`,
until it does.
