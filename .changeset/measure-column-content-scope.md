---
"@gridkitjs/react": patch
---

Fixed `sizeToContent` (double-click a resize handle) measuring the header's
own label as if it were a data cell when the grid has no rows, instead of
correctly doing nothing.
