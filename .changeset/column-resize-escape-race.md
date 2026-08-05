---
"@gridkitjs/react": patch
---

Fixed a bug where cancelling a column drag with `Escape` could discard another
column's width if that column was resized via keyboard while the drag was
still in progress. The cancelled column now reverts on its own, leaving
concurrent changes to other columns intact.
