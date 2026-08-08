---
"@gridkitjs/react": patch
---

Internal refactor of `DataGrid`'s implementation: pointer-drag lifecycles
(column resize, column reorder), "compute next state, bail if unchanged,
persist, notify" selection/sort commits, conditional class-name and ARIA
attribute construction, keyboard select-intent handling, and a couple of
`useMemo`-derived lookup structures now go through shared internal helpers
instead of five-plus near-duplicate copies. No public API or rendered
behavior changes for a correct caller.

One deliberate exception: `useColumnResize`'s `commit` was already missing
the bail-if-unchanged guard the other commit-style call sites have, so its
`"move"`-phase `onColumnResize` calls during a drag pinned against a
min/max clamp were left as-is (still firing on every pointer move) rather
than silently gaining a new guard — kept out of the shared
`commitIfChanged` helper on purpose, with a comment at the call site.
