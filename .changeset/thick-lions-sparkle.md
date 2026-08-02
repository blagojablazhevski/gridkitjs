---
"@gridkitjs/theme-tailwind": patch
---

Fix the grid overflowing its viewport by 1px under `borders="all"`. The first
column's left border had no neighbour to collapse with, so it added a pixel
the width calculations didn't account for — under `resizeMode="fit"` this
clipped the last column's border and, in narrow layouts, its content.
