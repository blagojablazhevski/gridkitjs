---
"@gridkitjs/react": minor
---

The grid is now an ARIA grid a keyboard can navigate. It carries `role="grid"`
with row and column counts and indices, headers carry `scope="col"`, and one
roving tab stop moves cell to cell under the arrow keys, Home, End, Ctrl+Home,
Ctrl+End and the page keys.

Two changes to what a keyboard already did:

- **Tab now passes the whole grid**, entering it once instead of stopping on
  every resize handle. The handles have left the tab order — a widget under
  `role="grid"` has one tab stop, and a grid of twenty columns previously had
  twenty.
- **Keyboard resize moved to `Alt+ArrowLeft` / `Alt+ArrowRight`** on the focused
  header, from the bare arrows on its handle, which the grid now needs for
  navigation. `Ctrl+ArrowLeft` / `Ctrl+ArrowRight` still reorder.

`label` and `labelledBy` give the grid its accessible name, without which a
screen reader announces only "grid":

```tsx
<DataGridComponent label="Application costs" ... />
```

Reorders and resizes are announced through a live region, so a change with only
a visual cue is no longer silent.
