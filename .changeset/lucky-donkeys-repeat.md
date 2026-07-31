---
"@gridkit/core": minor
"@gridkit/react": minor
---

Address nested fields with `"Parent.Child"` paths, and derive columns from data

`ColumnDefinition["field"]` now autocompletes one level of nesting via the new
`FieldPath<Row>` type, while still accepting any string so a path the type
cannot see is never a hard error. `defineColumnsFromRows` derives a column per
field across a set of rows, in first-seen order and without duplicates.

`ColumnDefinition` takes a second type parameter for what a header renders to.
It defaults to `string` in `@gridkit/core`, which stays framework-agnostic;
`@gridkit/react` exports a `ColumnDefinition<Row>` alias bound to `ReactNode`,
so a header callback can return JSX. This replaces the untyped `Function`.
