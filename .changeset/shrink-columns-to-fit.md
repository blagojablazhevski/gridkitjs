---
"@gridkitjs/core": minor
---

`fitColumnsToWidth` now shrinks unsized columns toward their `minWidth` when
they exceed the available width, instead of leaving them at their full size
and relying on the viewport to scroll. A `resizeMode="fit"` grid now fills a
narrow container in both directions; it still scrolls if every column is
already at its `minWidth` (or user-resized) and the total still doesn't fit.
