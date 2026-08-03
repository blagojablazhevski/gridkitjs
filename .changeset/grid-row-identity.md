---
"@gridkitjs/react": minor
---

`DataGridComponent` takes `getRowId`, giving each row a stable identity for
state keyed by it. Rows are keyed by it rather than by their array position, and
`cellTemplate` receives it as `rowId` alongside a `selected` flag.

```tsx
<DataGridComponent dataSource={rows} getRowId={(row) => row.Id} />
```

Without it a row is identified by its position, which is enough for a static
grid — so nothing has to change — but ties row state to where a row sits rather
than to the row itself.
